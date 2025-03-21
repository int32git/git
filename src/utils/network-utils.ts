export async function retryRequest(fetchFunction: () => Promise<Response>, retries: number = 3, delay: number = 1000): Promise<Response> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetchFunction();
      if (response.ok) {
        return response;
      }
    } catch (error) {
      console.error('Request failed, retrying...', error);
    }
    await new Promise(res => setTimeout(res, delay));
  }
  throw new Error('Request failed after multiple attempts');
} 