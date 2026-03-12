export const getResults = (res: any) => {
  if (res.data?.results) {
    return res.data.results;   // paginated response
  }
  return res.data;             // normal response
};