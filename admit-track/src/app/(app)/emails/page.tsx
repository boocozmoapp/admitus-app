// Email page has been replaced by Supervisors — redirect for any bookmarks
import { redirect } from "next/navigation";

export default function EmailsRedirectPage() {
  redirect("/supervisors");
}
