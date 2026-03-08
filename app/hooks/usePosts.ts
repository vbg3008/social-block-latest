import { useState } from "react";
import { useReadContract, useWriteContract, useConnection } from "wagmi";
import SocialBlockABI from "../../components/shared/SocialBlock.json";
import { CreatePostDTO } from "../lib/validations/post.schema";

const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const abi = SocialBlockABI.abi;

export function usePosts(params?: { limit?: number, offset?: number }) {
  const limit = params?.limit || 10;
  const offset = params?.offset || 0;

  const { data, isLoading, error, refetch } = useReadContract({
    address: contractAddress,
    abi: abi,
    functionName: "getRecentPosts",
    args: [BigInt(limit), BigInt(offset)],
  });

  return { 
    data: data ? Array.from(data as any[]).map((p: any) => ({
      id: Number(p.id),
      author: p.author,
      contentCid: p.contentCid,
      timestamp: Number(p.timestamp),
      likesCount: Number(p.likesCount)
    })) : [], 
    isLoading, 
    error: error?.message || null, 
    refetch 
  };
}

export function useCreatePost() {
  const { writeContractAsync } = useWriteContract();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  const createPost = async (dto: CreatePostDTO) => {
    setIsLoading(true);
    setError(null);
    try {
      // In a real dApp, we would upload to IPFS here to get the CID
      // For now we mock the CID or pass a placeholder if not provided
      const cid = "ipfs://placeholder_cid";
      
      const tx = await writeContractAsync({
        address: contractAddress,
        abi: abi,
        functionName: "createPost",
        args: [cid],
      });
      return tx;
    } catch (err: any) {
      setError({ message: err.message || "Failed to create post" });
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { createPost, isLoading, error };
}
