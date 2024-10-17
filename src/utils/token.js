import { BACKEND_URL } from "./endpoints";

export const getPosts = async (accessToken) => {
  console.log(`${BACKEND_URL}/api/post/list`);
  const request = new Request(`${BACKEND_URL}/api/post/list`, {
    method: "GET",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      Authorization: accessToken,
    },
  });

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
