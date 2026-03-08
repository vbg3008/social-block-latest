import { useWriteContract } from "wagmi";
import { toast } from "sonner";
import SocialBlockABI from "../../components/shared/SocialBlock.json";

const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const abi = SocialBlockABI.abi;

export function useLike() {
  const { writeContractAsync, isPending } = useWriteContract();

  const toggleLike = async (postId: string, isCurrentlyLiked: boolean) => {
    try {
      const functionName = isCurrentlyLiked ? "unlikePost" : "likePost";
      
      const tx = await writeContractAsync({
        address: contractAddress,
        abi: abi,
        functionName: functionName,
        args: [BigInt(postId)],
      });
      
      toast.success(`Transaction submitted! Hash: ${tx}`);
    } catch (err: any) {
      toast.error(err.shortMessage || err.message || "Failed to update like status");
    }
  };

  return {
    toggleLike,
    isLoading: isPending
  };
}
