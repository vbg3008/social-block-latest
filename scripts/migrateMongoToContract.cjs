const { ethers } = require("hardhat");
const mongoose = require("mongoose");

const MONGODB_URI = "mongodb://127.0.0.1:27017/socialblock";
const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

async function main() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB.");

  const usersCollection = mongoose.connection.collection("users");
  const postsCollection = mongoose.connection.collection("posts");

  const users = await usersCollection.find({}).toArray();
  const posts = await postsCollection.find({}).toArray();

  console.log(`Found ${users.length} users and ${posts.length} posts in MongoDB.`);

  if (users.length === 0) {
    console.log("No users to migrate. Exiting.");
    process.exit(0);
  }

  const signers = await ethers.getSigners();
  
  if (users.length > signers.length) {
      console.log(`Warning: More users (${users.length}) than available local signers (${signers.length}). Some users won't be mapped.`);
  }

  const SocialBlock = await ethers.getContractFactory("SocialBlock");
  const contract = SocialBlock.attach(CONTRACT_ADDRESS);

  const userMap = new Map();

  console.log("\n--- MIGRATING USERS ---");
  for (let i = 0; i < users.length && i < signers.length; i++) {
    const u = users[i];
    const signer = signers[i];
    
    // Default values if missing
    const username = u.username || `User_${i}`;
    const avatarCid = u.profilePicture || "";
    const bio = u.bio || "Migrated from Web2";

    try {
        const contractWithSigner = contract.connect(signer);
        const tx = await contractWithSigner.registerUser(username, avatarCid, bio);
        await tx.wait();
        console.log(`Migrated user: ${username} to address ${signer.address}`);
        userMap.set(u._id.toString(), signer);
    } catch (e) {
        if (e.message.includes("User already registered")) {
            console.log(`User at address ${signer.address} is already registered.`);
            userMap.set(u._id.toString(), signer); 
        } else {
            console.error(`Failed to migrate user ${username}:`, e.message);
        }
    }
  }

  console.log("\n--- MIGRATING POSTS ---");
  for (const p of posts) {
     const authorMongoId = p.author?.toString();
     const signer = userMap.get(authorMongoId);

     if (!signer) {
         console.log(`Skipping post ${p._id}. Author not mapped to a signer.`);
         continue;
     }

     let contentCid = p.content || "";
     if (p.media && p.media.length > 0) {
         contentCid = p.media[0];
     }
     
     if (!contentCid) contentCid = "ipfs://placeholder";

     try {
         const contractWithSigner = contract.connect(signer);
         const tx = await contractWithSigner.createPost(contentCid);
         await tx.wait();
         console.log(`Migrated post from ${signer.address}: ${contentCid.substring(0, 30)}...`);
     } catch (e) {
         console.error(`Failed to migrate post ${p._id}:`, e.message);
     }
  }

  console.log("\nMigration Complete!");
  await mongoose.disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
