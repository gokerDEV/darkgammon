import { useCallback, useEffect, useState } from "react";

const USER_ID_KEY = "pwm:userId";
const NICKNAME_KEY = "pwm:nickname";
const CHALLENGE_MSG_KEY = "pwm:challengeMsg";
const GIPHY_URL_KEY = "pwm:giphyUrl";
const SIDE_KEY = "darkgammon:side";

const DEFAULT_MESSAGES = [
  "You have no chance!",
  "Prepare to be crushed!",
  "Better luck next time!",
  "I'm unstoppable!",
  "Read 'em and weep!",
];

const DEFAULT_GIPHYS = [
  "https://media.giphy.com/media/l41JRsph73VokN6ik/giphy.gif",
  "https://media.giphy.com/media/26FPqAHtgCBzKG9mo/giphy.gif",
  "https://media.giphy.com/media/3o7TKSHA51OjmTGo2Q/giphy.gif",
  "https://media.giphy.com/media/l0HlHFRbmaZtBRhXG/giphy.gif",
];

function randomChoice(arr: string[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function readProfile(): {
  localUserId: string;
  nickname: string;
  challengeMsg: string;
  giphyUrl: string;
  side: "light" | "dark";
} {
  if (typeof window === "undefined")
    return {
      localUserId: "",
      nickname: "",
      challengeMsg: "",
      giphyUrl: "",
      side: "light",
    };
  let id = window.localStorage.getItem(USER_ID_KEY);
  if (!id) {
    id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `u_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
    window.localStorage.setItem(USER_ID_KEY, id);
  }

  let challengeMsg = window.localStorage.getItem(CHALLENGE_MSG_KEY);
  if (!challengeMsg) {
    challengeMsg = randomChoice(DEFAULT_MESSAGES);
    window.localStorage.setItem(CHALLENGE_MSG_KEY, challengeMsg);
  }

  let giphyUrl = window.localStorage.getItem(GIPHY_URL_KEY);
  if (!giphyUrl) {
    giphyUrl = randomChoice(DEFAULT_GIPHYS);
    window.localStorage.setItem(GIPHY_URL_KEY, giphyUrl);
  }

  let sideStr = window.localStorage.getItem(SIDE_KEY);
  if (sideStr !== "light" && sideStr !== "dark") {
    sideStr = "light";
  }

  return {
    localUserId: id,
    nickname: window.localStorage.getItem(NICKNAME_KEY) ?? "",
    challengeMsg,
    giphyUrl,
    side: sideStr as "light" | "dark",
  };
}

export function useLocalProfile() {
  const [profile, setProfile] = useState({
    localUserId: "",
    nickname: "",
    challengeMsg: "",
    giphyUrl: "",
    profileId: "",
    side: "light" as "light" | "dark",
  });

  useEffect(() => {
    const p = readProfile();
    setProfile((prev) => ({ ...prev, ...p }));

    const handleUpdate = () => {
      const p = readProfile();
      setProfile((prev) => ({ ...prev, ...p }));
    };
    if (typeof window !== "undefined") {
      window.addEventListener("profile-updated", handleUpdate);
    }

    // Attempt to fetch real profile from backend
    fetch("/api/profile/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.profile?._id) {
          const { _id, displayName, challengeMessage, victoryGifUrl, side } =
            data.profile;

          if (typeof window !== "undefined") {
            if (displayName)
              window.localStorage.setItem(NICKNAME_KEY, displayName);
            if (challengeMessage)
              window.localStorage.setItem(CHALLENGE_MSG_KEY, challengeMessage);
            if (victoryGifUrl)
              window.localStorage.setItem(GIPHY_URL_KEY, victoryGifUrl);

            if (side === "light" || side === "dark") {
              window.localStorage.setItem(SIDE_KEY, side);
              window.dispatchEvent(new Event("profile-updated"));
            }
          }

          setProfile((prev) => ({
            ...prev,
            profileId: _id,
            nickname: displayName || prev.nickname,
            challengeMsg: challengeMessage || prev.challengeMsg,
            giphyUrl: victoryGifUrl || prev.giphyUrl,
            side: side === "light" || side === "dark" ? side : prev.side,
          }));
        } else if (data.profile === null) {
          // Clear cached data from previous logins
          if (typeof window !== "undefined") {
            window.localStorage.removeItem(NICKNAME_KEY);
            window.localStorage.removeItem(CHALLENGE_MSG_KEY);
            window.localStorage.removeItem(GIPHY_URL_KEY);
            window.localStorage.removeItem(SIDE_KEY);
          }
          setProfile((prev) => ({
            ...prev,
            profileId: "",
            nickname: "",
            challengeMsg: "",
            giphyUrl: "",
            side: "light" as "light" | "dark",
          }));
        }
      })
      .catch(() => {});

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("profile-updated", handleUpdate);
      }
    };
  }, []);

  const setNickname = useCallback((nickname: string) => {
    const trimmed = nickname.trim().slice(0, 24);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(NICKNAME_KEY, trimmed);
    }
    setProfile((p) => ({ ...p, nickname: trimmed }));
  }, []);

  const setChallengeMsg = useCallback((msg: string) => {
    const trimmed = msg.trim().slice(0, 100);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(CHALLENGE_MSG_KEY, trimmed);
    }
    setProfile((p) => ({ ...p, challengeMsg: trimmed }));
  }, []);

  const setGiphyUrl = useCallback((url: string) => {
    const trimmed = url.trim();
    if (typeof window !== "undefined") {
      window.localStorage.setItem(GIPHY_URL_KEY, trimmed);
    }
    setProfile((p) => ({ ...p, giphyUrl: trimmed }));
  }, []);

  const setSide = useCallback((newSide: "light" | "dark") => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(SIDE_KEY, newSide);
      window.dispatchEvent(new Event("profile-updated"));
    }
    setProfile((p) => ({ ...p, side: newSide }));
  }, []);

  return {
    ...profile,
    setNickname,
    setChallengeMsg,
    setGiphyUrl,
    setSide,
    ready: profile.localUserId !== "",
  };
}

export const getAvatarInitial = (nickname?: string) =>
  (nickname?.trim()?.charAt(0) || "?").toUpperCase();
