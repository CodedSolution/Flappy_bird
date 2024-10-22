import { BACKEND_URL, GAME_TOKEN_ID } from "./endpoints";

export const checkUserClaimed = async (accessToken, userId) => {
  const request = new Request(
    `${BACKEND_URL}/api/token/miniGame/airdrop/${userId}`,
    {
      method: "GET",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
        Authorization: accessToken,
      },
    }
  );

  const response = await fetch(request);
  const contentType = response.headers.get("content-type");

  if (response.status === 500) {
    throw new Error("Internal server error");
  }

  if (response.status > 400 && response.status < 500) {
    throw new Error("Authentication or request error");
  }

  if (contentType && contentType.includes("application/json")) {
    const data = await response.json();
    return data.message;
  } else {
    throw new Error("Invalid response format, expected JSON");
  }
};

export const submitScores = async (accessToken, userId, points) => {
  console.log("GAME_TOKEN_ID:", GAME_TOKEN_ID);

  const body = {
    user: userId,
    token: GAME_TOKEN_ID,
    points: points,
  };

  console.log("Request Body:", body);
  const request = new Request(BACKEND_URL + `/api/token/miniGame`, {
    method: "POST",
    credentials: "same-origin",
    headers: {
      "Content-type": "application/json",
      authorization: accessToken,
    },
    body: JSON.stringify({
      user: userId,
      token: GAME_TOKEN_ID,
      points: points,
    }),
  });

  const response = await fetch(request);
  if (response.status === 500) {
    throw new Error("Internal server error");
  }
  if (response.status === 401) {
    throw new Error("Unauthorized");
  }
  const data = await response.json();
  if (response.status > 400 && response.status < 500) {
    if (data.detail) {
      throw data.detail;
    }
    throw data.message.error;
  }
  return data.message;
};
