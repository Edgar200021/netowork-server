export interface FacebookTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface FacebookUserInfoResponse {
  id: string;
  first_name: string;
  last_name
  email: string;
  picture: {
    data: {
      url: string;
    };
  };
}
