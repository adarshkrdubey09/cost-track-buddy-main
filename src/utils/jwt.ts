import {jwtDecode} from "jwt-decode";

interface JwtPayload {
  exp: number; // expiration time in seconds
}

export const getTokenExpiration = (token: string): number | null => {
  try {
    
    const decoded = jwtDecode<JwtPayload>(token);
        // const decoded = jwtDecode<JwtPayload>(localStorage.getItem("access_token"));
          console.log(decoded)

    return decoded.exp * 1000; // convert to ms
  } catch {
    return null;
  }
};



// console.log(getTokenExpiration(localStorage.getItem("access_token")))