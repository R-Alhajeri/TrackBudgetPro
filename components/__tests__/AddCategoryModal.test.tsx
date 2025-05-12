import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import AddCategoryModal from "../AddCategoryModal";

describe("AddCategoryModal", () => {
  it("renders the modal", () => {
    const mockOnClose = jest.fn();
    jest.mock("@/store/budget-store", () => () => ({
      createCategoryInBackend: jest
        .fn()
        .mockResolvedValue({
          id: "cat-1",
          name: "Test",
          color: "#fff",
          icon: "home",
          budget: 0,
          spent: 0,
        }),
      baseCurrency: "USD",
      currencies: [{ code: "USD", symbol: "$" }],
      fetchCategoriesFromBackend: jest
        .fn()
        .mockResolvedValue([
          {
            id: "cat-1",
            name: "Test",
            color: "#fff",
            icon: "home",
            budget: 0,
            spent: 0,
          },
        ]),
      fetchBudgetFromBackend: jest.fn(),
      selectedMonth: "2025-05",
      setBudgetToBackend: jest.fn(),
    }));
    const { getByText } = render(
      <AddCategoryModal visible={true} onClose={mockOnClose} />
    );
    expect(getByText(/category/i)).toBeTruthy();
  });
});
