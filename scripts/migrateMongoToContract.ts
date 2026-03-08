import "@nomicfoundation/hardhat-ethers";
import { ethers } from "hardhat";
import mongoose from "mongoose";

const MONGODB_URI = "mongodb://127.0.0.1:27017/socialblock";
const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

async function main() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB.");

  // Get raw collections since models were deleted
  const usersCollection = mongoose.connection.collection("users");
  const postsCollection = mongoose.connection.collection("posts");

  const users = await usersCollection.find({}).toArray();
  const posts = await postsCollection.find({}).toArray();

  console.log(`Found ${users.length} users and ${posts.length} posts in MongoDB.`);

  if (users.length === 0) {
    console.log("No users to migrate. Exiting.");
    process.exit(0);
  }

  // Get local Hardhat signers to represent these users
  const signers = await ethers.getSigners();
  
  if (users.length > signers.length) {
      console.log(`Warning: More users (${users.length}) than available local signers (${signers.length}). Some users won't be mapped.`);
  }

  const SocialBlock = await ethers.getContractFactory("SocialBlock");
  const contract = SocialBlock.attach(CONTRACT_ADDRESS);

  // Map Mongo ID to assigned Hardhat Signer
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
        const contractWithSigner = contract.connect(signer) as any;
        const tx = await contractWithSigner.registerUser(username, avatarCid, bio);
        await tx.wait();
        console.log(`Migrated user: ${username} to address ${signer.address}`);
        userMap.set(u._id.toString(), signer);
    } catch (e: any) {
        if (e.message.includes("User already registered")) {
            console.log(`User at address ${signer.address} is already registered.`);
            userMap.set(u._id.toString(), signer); // Still map them so we can migrate their posts
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

     // In the old system, imagery could be an array of URLs. We need a single string (CID) for the contract.
     // For migration, we'll store a JSON stringified version or just the first image if it exists.
     let contentCid = p.content || "";
     if (p.media && p.media.length > 0) {
         contentCid = p.media[0]; // Take the first URL as the CID equivalent
     }
     
     if (!contentCid) contentCid = "ipfs://placeholder";

     try {
         const contractWithSigner = contract.connect(signer) as any;
         const tx = await contractWithSigner.createPost(contentCid);
         await tx.wait();
         console.log(`Migrated post from ${signer.address}: ${contentCid.substring(0, 30)}...`);
     } catch (e: any) {
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
