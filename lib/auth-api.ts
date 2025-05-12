import { trpcClient } from "@/lib/trpc";
import useAuthStore from "@/store/auth-store";

export async function loginWithBackend(
  email: string,
  password: string
): Promise<boolean> {
  try {
    console.log("Sending login request to backend...");
    const res = await trpcClient.auth.login.mutate({ email, password });
    console.log("Login response received:", res ? "Success" : "Failed");

    if (res && res.token && res.user) {
      console.log("Setting auth in store with user:", res.user.email);
      useAuthStore.getState().setAuth({ user: res.user, token: res.token });
      return true;
    }
    console.log("Login failed: Invalid response format");
    return false;
  } catch (error) {
    console.error("Login error:", error);
    return false;
  }
}

export async function signupWithBackend(
  name: string,
  email: string,
  password: string
): Promise<boolean> {
  try {
    const res = await trpcClient.auth.register.mutate({
      name,
      email,
      password,
    });
    if (res && res.success) {
      // Auto-login after signup
      return await loginWithBackend(email, password);
    }
    return false;
  } catch (error) {
    return false;
  }
}

export async function guestLoginWithBackend(): Promise<boolean> {
  try {
    const res = await trpcClient.auth.createGuest.mutate();

    if (res && res.token && res.user) {
      useAuthStore.getState().setAuth({ user: res.user, token: res.token });
      return true;
    } else {
      console.warn(
        "[guestLoginWithBackend] Guest login mutation did not return expected token/user:",
        res
      );
      return false;
    }
  } catch (error) {
    console.error("[guestLoginWithBackend] Error during guest login:", error);
    return false;
  }
}
