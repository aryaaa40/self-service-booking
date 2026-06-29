export type ApiResponse<T> = {
  meta: {
    success: boolean;
    message: string;
    statusCode: number;
  };
  data: T;
};
