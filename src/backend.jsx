import mondaySdk from "monday-sdk-js";
import axios from "axios";

const monday = mondaySdk();
monday.setApiVersion("2025-04");

const backend = {
  api: async (method, path, params) => {
    const res = await monday.get("sessionToken");
    const sessionToken = res.data;
    const config = {
      baseURL: import.meta.env.VITE_BACKEND,
      url: path,
      method,
      headers: {
        authorization: sessionToken
      },
    };
    if (method === "get") {
      config.params = params;
    } else {
      config.data = params;
    }

    return await axios(config);
  },
  get: async (path, params) => {
    const response = await backend.api("get", path, params);
    return response;
  },
  post: async (path, params) => {
    const response = await backend.api("post", path, params);
    return response;
  }
}

export default backend;