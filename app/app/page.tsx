import { currentUser } from "@/lib/session";
import { Workspace } from "@/components/vault/Workspace";
export default async function AppHome() {
  const user = (await currentUser())!;
  return <Workspace uid={user.id} name={user.name} email={user.email} demo={user.demo} guest={user.guest} />;
}
