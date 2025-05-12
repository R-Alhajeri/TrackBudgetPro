import { View, Text, StyleSheet, Button } from "react-native";
import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";

export default function TrpcTestComponent() {
  const [message, setMessage] = useState<string>(
    "Waiting to test connection..."
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);

  // Set up the TRPC mutation
  const helloMutation = trpc.example.hi.useMutation({
    onSuccess: (data) => {
      setMessage(`Connection successful! Response: ${data.hello}`);
      setIsLoading(false);
      setHasError(false);
    },
    onError: (error) => {
      setMessage(`Error: ${error.message}`);
      setIsLoading(false);
      setHasError(true);
    },
  });

  // Function to test the connection
  const testConnection = () => {
    setIsLoading(true);
    setMessage("Testing connection...");
    helloMutation.mutate({ name: "Elegant Budget App" });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>TRPC Connection Test</Text>

      <Text
        style={[
          styles.message,
          hasError
            ? styles.errorText
            : message.includes("successful")
            ? styles.successText
            : styles.normalText,
        ]}
      >
        {message}
      </Text>

      <Button
        title={isLoading ? "Testing..." : "Test Connection"}
        onPress={testConnection}
        disabled={isLoading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
    margin: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  message: {
    marginVertical: 15,
    padding: 10,
    borderRadius: 5,
    textAlign: "center",
  },
  errorText: {
    backgroundColor: "#ffebee",
    color: "#d32f2f",
  },
  successText: {
    backgroundColor: "#e8f5e9",
    color: "#2e7d32",
  },
  normalText: {
    backgroundColor: "#e3f2fd",
    color: "#1976d2",
  },
});
