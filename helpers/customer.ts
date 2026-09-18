// helpers/customer.ts
export async function processCustomer(customerData: any) {
  try {
    console.log("[Customer Process] Data received:", customerData);
    
    // Add your customer logic here
    
    return { success: true };
  } catch (error) {
    console.error("[Customer Process Error]:", error);
    return { success: false, error };
  }
}