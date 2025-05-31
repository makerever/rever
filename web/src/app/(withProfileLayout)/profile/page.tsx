// Profile setting page

import { ProfileSettings } from "@rever/common";

const Profile = () => {
  return (
    <>
      <p className="text-slate-800 dark:text-slate-100 text-lg font-semibold mb-6">
        Profile
      </p>

      <ProfileSettings />
    </>
  );
};

export default Profile;
