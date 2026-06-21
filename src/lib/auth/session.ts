import { auth } from "@/auth";

export const getServerAuthSession = async () => {
  return await auth();
};
