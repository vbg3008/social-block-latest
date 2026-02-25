import { connectDB } from "@/app/lib/mongo";
import User from "@/app/models/User";


export async function GET() {
  await connectDB();

  const users = await User.find();

  return Response.json(users);
}

export async function POST(req: Request) {
  await connectDB();

  const body = await req.json();
  const user = await User.create(body);

  return Response.json(user);
}