// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract SocialBlock {
    // Defines standard structures and mappings for the DApp
    
    struct User {
        string username; // Keep it simple for now, could be ENS
        string avatarCid; // IPFS CID for avatar
        string bio;
        bool isRegistered;
    }

    struct Post {
        uint256 id;
        address author;
        string contentCid; // IPFS CID containing text/media info
        uint256 timestamp;
        uint256 likesCount;
    }

    uint256 public postCount = 0;
    
    mapping(address => User) public users;
    mapping(uint256 => Post) public posts;
    
    // address => array of post IDs
    mapping(address => uint256[]) public userPosts;
    
    // Map post ID to mapping of user address => bool (hasLiked)
    mapping(uint256 => mapping(address => bool)) public postLikes;

    // Follow system: userAddress => followedAddress => bool
    mapping(address => mapping(address => bool)) public following;
    
    // Metrics
    mapping(address => uint256) public followerCount;
    mapping(address => uint256) public followingCount;

    // Events
    event UserRegistered(address indexed userAddress, string username);
    event PostCreated(uint256 indexed postId, address indexed author, string contentCid);
    event PostLiked(uint256 indexed postId, address indexed liker);
    event PostUnliked(uint256 indexed postId, address indexed unliker);
    event UserFollowed(address indexed follower, address indexed followed);
    event UserUnfollowed(address indexed follower, address indexed unfollowed);

    modifier onlyRegistered() {
        require(users[msg.sender].isRegistered, "User not registered");
        _;
    }

    function registerUser(string memory _username, string memory _avatarCid, string memory _bio) external {
        require(!users[msg.sender].isRegistered, "User already registered");
        
        users[msg.sender] = User({
            username: _username,
            avatarCid: _avatarCid,
            bio: _bio,
            isRegistered: true
        });

        emit UserRegistered(msg.sender, _username);
    }

    function createPost(string memory _contentCid) external onlyRegistered {
        postCount++;
        
        posts[postCount] = Post({
            id: postCount,
            author: msg.sender,
            contentCid: _contentCid,
            timestamp: block.timestamp,
            likesCount: 0
        });

        userPosts[msg.sender].push(postCount);

        emit PostCreated(postCount, msg.sender, _contentCid);
    }

    function likePost(uint256 _postId) external onlyRegistered {
        require(_postId > 0 && _postId <= postCount, "Post does not exist");
        require(!postLikes[_postId][msg.sender], "Already liked");

        postLikes[_postId][msg.sender] = true;
        posts[_postId].likesCount++;

        emit PostLiked(_postId, msg.sender);
    }

    function unlikePost(uint256 _postId) external onlyRegistered {
        require(_postId > 0 && _postId <= postCount, "Post does not exist");
        require(postLikes[_postId][msg.sender], "Not liked yet");

        postLikes[_postId][msg.sender] = false;
        // Prevent underflow
        if (posts[_postId].likesCount > 0) {
            posts[_postId].likesCount--;
        }

        emit PostUnliked(_postId, msg.sender);
    }

    function followUser(address _userToFollow) external onlyRegistered {
        require(_userToFollow != msg.sender, "Cannot follow yourself");
        require(users[_userToFollow].isRegistered, "Target user not registered");
        require(!following[msg.sender][_userToFollow], "Already following");

        following[msg.sender][_userToFollow] = true;
        followingCount[msg.sender]++;
        followerCount[_userToFollow]++;

        emit UserFollowed(msg.sender, _userToFollow);
    }

    function unfollowUser(address _userToUnfollow) external onlyRegistered {
        require(following[msg.sender][_userToUnfollow], "Not following");

        following[msg.sender][_userToUnfollow] = false;
        
        if (followingCount[msg.sender] > 0) {
            followingCount[msg.sender]--;
        }
        if (followerCount[_userToUnfollow] > 0) {
            followerCount[_userToUnfollow]--;
        }

        emit UserUnfollowed(msg.sender, _userToUnfollow);
    }

    // Helper functions for reading data arrays easily

    function getUserPosts(address _user) external view returns (uint256[] memory) {
        return userPosts[_user];
    }
    
    // Simple pagination helper for recent posts
    function getRecentPosts(uint256 _count, uint256 _offset) external view returns (Post[] memory) {
        require(_count > 0, "Count must be > 0");
        
        uint256 startTokenId = postCount > _offset ? postCount - _offset : 0;
        uint256 returnCount = startTokenId > _count ? _count : startTokenId;
        
        Post[] memory result = new Post[](returnCount);
        uint256 currentIndex = 0;
        
        for (uint256 i = startTokenId; i > startTokenId - returnCount; i--) {
            result[currentIndex] = posts[i];
            currentIndex++;
        }
        
        return result;
    }
}
