import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  FlatList,
  Pressable,
  TextInput,
  Dimensions,
} from "react-native";
import { AntDesign, Feather } from "@expo/vector-icons";
import useBudgetStore from "@/store/budget-store";
import useAppTheme from "@/hooks/useAppTheme";
import useLanguageStore from "@/store/language-store";
import { defaultCurrencies } from "@/constants/currencies";
import { Currency } from "@/types/budget";

interface CurrencySelectorProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (currencyCode: string) => void;
  selectedCurrency: string;
}

const CurrencySelector: React.FC<CurrencySelectorProps> = ({
  visible,
  onClose,
  onSelect,
  selectedCurrency,
}) => {
  const { colors } = useAppTheme();
  const { t, isRTL } = useLanguageStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [localSelectedCurrency, setLocalSelectedCurrency] =
    useState(selectedCurrency);

  // Reset search and update local state when modal becomes visible or selectedCurrency changes
  useEffect(() => {
    if (visible) {
      setSearchQuery("");
      setLocalSelectedCurrency(selectedCurrency);
    }
  }, [selectedCurrency, visible]);

  // Remove duplicate currencies (some might have the same code)
  const uniqueCurrencies = defaultCurrencies.filter(
    (currency, index, self) =>
      index === self.findIndex((c) => c.code === currency.code)
  );

  const filteredCurrencies =
    searchQuery.trim() === ""
      ? uniqueCurrencies
      : uniqueCurrencies.filter(
          (currency) =>
            currency.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            currency.code.toLowerCase().includes(searchQuery.toLowerCase())
        );

  const handleCurrencySelect = (currencyCode: string) => {
    setLocalSelectedCurrency(currencyCode);
    onSelect(currencyCode);
  };

  const renderCurrencyItem = ({ item }: { item: Currency }) => (
    <Pressable
      style={[
        styles.currencyItem,
        { borderBottomColor: colors.border },
        localSelectedCurrency === item.code && {
          backgroundColor: `${colors.primary}10`,
        },
        isRTL && styles.rtlFlexRowReverse,
      ]}
      onPress={() => handleCurrencySelect(item.code)}
    >
      <View style={styles.currencyInfo}>
        <Text style={[styles.currencyCode, { color: colors.text }]}>
          {item.code}
        </Text>
        <Text style={[styles.currencyName, { color: colors.subtext }]}>
          {item.name} ({item.symbol})
        </Text>
      </View>
      {localSelectedCurrency === item.code && (
        <AntDesign name="check" size={20} color={colors.primary} />
      )}
    </Pressable>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View
        style={[
          styles.modalContainer,
          { backgroundColor: "rgba(0, 0, 0, 0.5)" },
        ]}
      >
        <View
          style={[styles.modalContent, { backgroundColor: colors.background }]}
        >
          <View
            style={[
              styles.modalHeader,
              { borderBottomColor: colors.border },
              isRTL && styles.rtlFlexRowReverse,
            ]}
          >
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {t("selectCurrency")}
            </Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <AntDesign name="close" size={24} color={colors.text} />
            </Pressable>
          </View>

          <View
            style={[
              styles.searchContainer,
              { backgroundColor: colors.card, borderColor: colors.border },
              isRTL && styles.rtlFlexRowReverse,
            ]}
          >
            <Feather name="search" size={20} color={colors.subtext} />
            <TextInput
              style={[
                styles.searchInput,
                {
                  color: colors.text,
                  textAlign: isRTL ? "right" : "left",
                },
              ]}
              placeholder={t("searchCurrencies")}
              placeholderTextColor={colors.subtext}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery("")}>
                <AntDesign name="close" size={18} color={colors.subtext} />
              </Pressable>
            )}
          </View>

          <Text style={[styles.currencyCount, { color: colors.subtext }]}>
            {filteredCurrencies.length} currencies available
          </Text>

          <FlatList
            data={filteredCurrencies}
            renderItem={renderCurrencyItem}
            keyExtractor={(item) => item.code}
            style={styles.currencyList}
            showsVerticalScrollIndicator={false}
            initialNumToRender={20}
            maxToRenderPerBatch={20}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 20,
    height: Dimensions.get("window").height * 0.5, // Explicitly set to 50% of viewport height
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  rtlFlexRowReverse: {
    flexDirection: "row-reverse",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    margin: 16,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 8,
    marginRight: 8,
    height: 44,
  },
  currencyCount: {
    fontSize: 14,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  currencyList: {
    flex: 1,
    marginHorizontal: 16,
  },
  currencyItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
  },
  currencyInfo: {
    flex: 1,
  },
  currencyCode: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  currencyName: {
    fontSize: 14,
  },
});
export default CurrencySelector;
