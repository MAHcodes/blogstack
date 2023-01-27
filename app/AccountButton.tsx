import { useProfile } from "nostr-react";
import { useState } from "react";
import { IoChevronDown } from "react-icons/io5";
import Button from "./Button";
import { DUMMY_PROFILE_API } from "./lib/constants";
import ProfileMenu from "./ProfileMenu";

interface AccountButtonProps {
  pubkey: string;
}

export default function AccountButton({ pubkey }: AccountButtonProps) {
  const [showMenu, setShowMenu] = useState(false);
  const { data } = useProfile({
    pubkey,
  });

  return (
    <div className="relative">
      <Button
        color="transparent"
        icon={<IoChevronDown />}
        iconAfter
        className="flex items-center gap-2 text-gray hover:text-gray-hover"
        onClick={() => setShowMenu((currrent) => !currrent)}
      >
        <span className="rounded-full">
          <img
            className="rounded-full w-8 h-8 object-cover"
            src={data?.picture || DUMMY_PROFILE_API(data?.name || data?.npub!)}
            alt=""
          />
        </span>
      </Button>
      {showMenu && <ProfileMenu pubkey={pubkey} />}
    </div>
  );
}
