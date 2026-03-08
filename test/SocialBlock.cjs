const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SocialBlock", function () {
  let socialBlock;
  let owner;
  let user1;
  let user2;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    const SocialBlock = await ethers.getContractFactory("SocialBlock");
    socialBlock = await SocialBlock.deploy();
  });

  describe("User Registration", function () {
    it("Should allow a user to register", async function () {
      await expect(socialBlock.connect(user1).registerUser("alice", "ipfs://avatar", "Hello Web3!"))
        .to.emit(socialBlock, "UserRegistered")
        .withArgs(user1.address, "alice");

      const user = await socialBlock.users(user1.address);
      expect(user.username).to.equal("alice");
      expect(user.isRegistered).to.be.true;
    });

    it("Should prevent duplicate registration", async function () {
      await socialBlock.connect(user1).registerUser("alice", "ipfs://avatar", "Hello Web3!");
      await expect(
        socialBlock.connect(user1).registerUser("alice2", "ipfs://avatar2", "Hello again!")
      ).to.be.revertedWith("User already registered");
    });
  });

  describe("Posts", function () {
    beforeEach(async function () {
      await socialBlock.connect(user1).registerUser("alice", "ipfs://avatar", "Hello Web3!");
    });

    it("Should allow a registered user to create a post", async function () {
      await expect(socialBlock.connect(user1).createPost("ipfs://content"))
        .to.emit(socialBlock, "PostCreated")
        .withArgs(1, user1.address, "ipfs://content");

      const post = await socialBlock.posts(1);
      expect(post.author).to.equal(user1.address);
      expect(post.contentCid).to.equal("ipfs://content");
      
      const userPosts = await socialBlock.getUserPosts(user1.address);
      expect(userPosts.length).to.equal(1);
      expect(userPosts[0]).to.equal(1);
    });

    it("Should prevent an unregistered user from creating a post", async function () {
      await expect(
        socialBlock.connect(user2).createPost("ipfs://content")
      ).to.be.revertedWith("User not registered");
    });
  });

  describe("Likes and Follows", function () {
    beforeEach(async function () {
      await socialBlock.connect(user1).registerUser("alice", "ipfs://avatar", "Hello Web3!");
      await socialBlock.connect(user2).registerUser("bob", "ipfs://avatar2", "Hi!");
      await socialBlock.connect(user1).createPost("ipfs://post1");
    });

    it("Should allow user to like a post", async function () {
      await expect(socialBlock.connect(user2).likePost(1))
        .to.emit(socialBlock, "PostLiked")
        .withArgs(1, user2.address);

      const post = await socialBlock.posts(1);
      expect(post.likesCount).to.equal(1);
      
      const hasLiked = await socialBlock.postLikes(1, user2.address);
      expect(hasLiked).to.be.true;
    });

    it("Should allow user to follow another user", async function () {
      await expect(socialBlock.connect(user2).followUser(user1.address))
        .to.emit(socialBlock, "UserFollowed")
        .withArgs(user2.address, user1.address);

      const isFollowing = await socialBlock.following(user2.address, user1.address);
      expect(isFollowing).to.be.true;
      
      const followerCount = await socialBlock.followerCount(user1.address);
      expect(followerCount).to.equal(1);
    });
  });
});
