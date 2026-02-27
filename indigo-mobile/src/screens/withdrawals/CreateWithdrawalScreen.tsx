/**
 * CreateWithdrawalScreen
 * 3-step modal flow to request a withdrawal
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import Decimal from 'decimal.js';

import { useTheme } from '@/app/providers/ThemeProvider';
import { useAuthStore } from '@/stores/authStore';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { getFundsWithBalances, createWithdrawal } from '@/services/withdrawals/withdrawalService';
import { parseAmount, formatAmount } from '@/utils/formatting/currency';
import type { FundWithBalance } from '@/types/domains/fund';
import type { RootStackParamList } from '@/app/navigation/types';
import type { RootScreenProps } from '@/app/navigation/types';

type Props = RootScreenProps<'CreateWithdrawal'>;
type NavProp = NativeStackNavigationProp<RootStackParamList>;

type Step = 1 | 2 | 3;

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: Step }) {
  const { theme } = useTheme();
  const steps: Step[] = [1, 2, 3];
  const labels = ['Asset & Amount', 'Review', 'Confirm'];
  const styles = makeStyles(theme);

  return (
    <View style={styles.stepIndicator}>
      {steps.map((step, idx) => (
        <React.Fragment key={step}>
          <View style={styles.stepItem}>
            <View
              style={[
                styles.stepDot,
                {
                  backgroundColor: current >= step ? theme.primary : theme.elevated,
                },
              ]}
            >
              {current > step ? (
                <Ionicons name="checkmark" size={12} color="#fff" />
              ) : (
                <Text
                  variant="caption"
                  style={{ ...styles.stepNumber, color: current >= step ? '#fff' : theme.textMuted }}
                >
                  {step}
                </Text>
              )}
            </View>
            <Text
              variant="caption"
              style={{ color: current === step ? theme.text : theme.textMuted }}
            >
              {labels[idx]}
            </Text>
          </View>
          {idx < steps.length - 1 && (
            <View
              style={[
                styles.stepLine,
                { backgroundColor: current > step ? theme.primary : theme.border },
              ]}
            />
          )}
        </React.Fragment>
      ))}
    </View>
  );
}

// ─── Fund selector ────────────────────────────────────────────────────────────

function FundSelector({
  funds,
  selected,
  onSelect,
}: {
  funds: FundWithBalance[];
  selected: FundWithBalance | null;
  onSelect: (fund: FundWithBalance) => void;
}) {
  const { theme } = useTheme();
  const styles = makeStyles(theme);

  return (
    <View style={styles.fundList}>
      {funds.map((fund) => {
        const isSelected = selected?.id === fund.id;
        const balance = parseAmount(fund.available_balance);
        const hasBalance = balance.gt(0);

        return (
          <TouchableOpacity
            key={fund.id}
            style={[
              styles.fundCard,
              {
                borderColor: isSelected ? theme.primary : theme.border,
                opacity: hasBalance ? 1 : 0.5,
              },
            ]}
            onPress={() => hasBalance && onSelect(fund)}
            disabled={!hasBalance}
            activeOpacity={0.7}
          >
            <View style={styles.fundCardContent}>
              <View style={[styles.fundIcon, { backgroundColor: `${theme.primary}20` }]}>
                <Text variant="label" style={{ color: theme.primary }}>
                  {fund.asset_symbol}
                </Text>
              </View>
              <View style={styles.fundInfo}>
                <Text variant="label">{fund.name}</Text>
                <Text variant="caption" color="muted">
                  Available: {formatAmount(fund.available_balance, fund.asset_symbol)}{' '}
                  {fund.asset_symbol}
                </Text>
              </View>
              {isSelected && (
                <Ionicons name="checkmark-circle" size={22} color={theme.primary} />
              )}
              {!hasBalance && (
                <Badge variant="default">No balance</Badge>
              )}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export function CreateWithdrawalScreen({ route }: Props) {
  const { theme } = useTheme();
  const navigation = useNavigation<NavProp>();
  const { authenticateWithBiometric, biometricEnabled, biometricLabel } = useAuthStore();

  const initialFundId = route.params?.fundId;

  const [step, setStep] = useState<Step>(1);
  const [funds, setFunds] = useState<FundWithBalance[]>([]);
  const [loadingFunds, setLoadingFunds] = useState(true);
  const [fundsError, setFundsError] = useState<string | null>(null);

  // Step 1 state
  const [selectedFund, setSelectedFund] = useState<FundWithBalance | null>(null);
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');

  // Step 2 state (Review — no extra data needed)

  // Submit state
  const [submitting, setSubmitting] = useState(false);

  // Validation errors
  const [amountError, setAmountError] = useState<string | null>(null);

  // Load funds
  useEffect(() => {
    (async () => {
      try {
        setFundsError(null);
        const data = await getFundsWithBalances();
        setFunds(data);

        // Pre-select fund if fundId was passed
        if (initialFundId) {
          const match = data.find((f) => f.id === initialFundId);
          if (match) setSelectedFund(match);
        }
      } catch {
        setFundsError('Unable to load fund balances.');
      } finally {
        setLoadingFunds(false);
      }
    })();
  }, [initialFundId]);

  const availableBalance = selectedFund ? parseAmount(selectedFund.available_balance) : new Decimal(0);

  const validateStep1 = useCallback((): boolean => {
    if (!selectedFund) {
      Alert.alert('Select a fund', 'Please select an asset to withdraw from.');
      return false;
    }
    const amountDec = parseAmount(amount);
    if (amountDec.lte(0)) {
      setAmountError('Amount must be greater than 0.');
      return false;
    }
    if (amountDec.gt(availableBalance)) {
      setAmountError(
        `Amount exceeds available balance of ${formatAmount(availableBalance, selectedFund.asset_symbol)} ${selectedFund.asset_symbol}.`
      );
      return false;
    }
    setAmountError(null);
    return true;
  }, [selectedFund, amount, availableBalance]);

  const handleNext = useCallback(() => {
    if (step === 1) {
      if (!validateStep1()) return;
      setStep(2);
    }
  }, [step, validateStep1]);

  const handleBack = useCallback(() => {
    if (step > 1) {
      setStep((s) => (s - 1) as Step);
    } else {
      navigation.goBack();
    }
  }, [step, navigation]);

  const handleSetMax = useCallback(() => {
    if (selectedFund) {
      setAmount(formatAmount(availableBalance, selectedFund.asset_symbol));
      setAmountError(null);
    }
  }, [selectedFund, availableBalance]);

  const handleSubmit = useCallback(async () => {
    if (!selectedFund) return;

    // Biometric confirm if enabled
    if (biometricEnabled) {
      const ok = await authenticateWithBiometric();
      if (!ok) {
        Alert.alert('Authentication Failed', 'Biometric authentication failed. Please try again.');
        return;
      }
    }

    setSubmitting(true);
    try {
      await createWithdrawal({
        fund_id: selectedFund.id,
        amount: parseAmount(amount).toFixed(8),
        notes: notes.trim() || undefined,
      });

      // Navigate to Withdrawals list
      navigation.navigate('Main', { screen: 'Withdrawals' } as never);
    } catch {
      Alert.alert('Request Failed', 'Unable to submit withdrawal request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [selectedFund, amount, notes, biometricEnabled, authenticateWithBiometric, navigation]);

  const styles = makeStyles(theme);

  // ── Loading funds ────────────────────────────────────────────────────────
  if (loadingFunds) {
    return (
      <SafeAreaView style={[styles.root, styles.centered]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text variant="caption" color="muted">
          Loading fund balances…
        </Text>
      </SafeAreaView>
    );
  }

  if (fundsError) {
    return (
      <SafeAreaView style={[styles.root, styles.centered]}>
        <Ionicons name="cloud-offline-outline" size={48} color={theme.textMuted} />
        <Text variant="body" color="muted" style={styles.errorMsg}>
          {fundsError}
        </Text>
        <Button
          onPress={async () => {
            setLoadingFunds(true);
            try {
              const data = await getFundsWithBalances();
              setFunds(data);
              setFundsError(null);
            } catch {
              setFundsError('Unable to load fund balances.');
            } finally {
              setLoadingFunds(false);
            }
          }}
          variant="outline"
        >
          Retry
        </Button>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* ── Modal header ── */}
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={handleBack} style={styles.backBtn} activeOpacity={0.7}>
            <Ionicons
              name={step === 1 ? 'close' : 'arrow-back'}
              size={24}
              color={theme.text}
            />
          </TouchableOpacity>
          <Text variant="h4" style={styles.modalTitle}>
            Request Withdrawal
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        <StepIndicator current={step} />

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ══ STEP 1: Asset & Amount ══ */}
          {step === 1 && (
            <View style={styles.stepContent}>
              <Text variant="h4" style={styles.stepTitle}>
                Select Asset & Amount
              </Text>
              <Text variant="caption" color="muted" style={styles.stepSubtitle}>
                Choose which fund to withdraw from.
              </Text>

              {funds.length === 0 ? (
                <View style={styles.noFunds}>
                  <Ionicons name="wallet-outline" size={40} color={theme.textMuted} />
                  <Text variant="body" color="muted">
                    No funds available for withdrawal.
                  </Text>
                </View>
              ) : (
                <FundSelector
                  funds={funds}
                  selected={selectedFund}
                  onSelect={(f) => {
                    setSelectedFund(f);
                    setAmount('');
                    setAmountError(null);
                  }}
                />
              )}

              {selectedFund && (
                <View style={styles.amountSection}>
                  <View style={styles.amountLabelRow}>
                    <Text variant="label">Amount ({selectedFund.asset_symbol})</Text>
                    <TouchableOpacity onPress={handleSetMax} activeOpacity={0.7}>
                      <Text variant="caption" style={{ color: theme.primary }}>
                        Max
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <Input
                    value={amount}
                    onChangeText={(v) => {
                      setAmount(v);
                      setAmountError(null);
                    }}
                    keyboardType="decimal-pad"
                    placeholder="0.00"
                    leftIcon={
                      <Ionicons name="cash-outline" size={18} color={theme.textMuted} />
                    }
                    error={amountError ?? undefined}
                  />

                  <Text variant="caption" color="muted">
                    Available:{' '}
                    {formatAmount(availableBalance, selectedFund.asset_symbol)}{' '}
                    {selectedFund.asset_symbol}
                  </Text>

                  <Input
                    label="Notes (optional)"
                    value={notes}
                    onChangeText={setNotes}
                    placeholder="Reference or note for this withdrawal"
                    multiline
                  />
                </View>
              )}
            </View>
          )}

          {/* ══ STEP 2: Review ══ */}
          {step === 2 && selectedFund && (
            <View style={styles.stepContent}>
              <Text variant="h4" style={styles.stepTitle}>
                Review Request
              </Text>
              <Text variant="caption" color="muted" style={styles.stepSubtitle}>
                Confirm your withdrawal details before submitting.
              </Text>

              <Card style={styles.reviewCard}>
                <View style={styles.reviewRow}>
                  <Text variant="caption" color="muted">
                    Fund
                  </Text>
                  <Text variant="label">{selectedFund.name}</Text>
                </View>
                <View style={styles.reviewDivider} />
                <View style={styles.reviewRow}>
                  <Text variant="caption" color="muted">
                    Asset
                  </Text>
                  <Badge variant="default">{selectedFund.asset_symbol}</Badge>
                </View>
                <View style={styles.reviewDivider} />
                <View style={styles.reviewRow}>
                  <Text variant="caption" color="muted">
                    Amount
                  </Text>
                  <Text variant="value" style={{ color: theme.destructive }}>
                    -{formatAmount(amount, selectedFund.asset_symbol)}{' '}
                    {selectedFund.asset_symbol}
                  </Text>
                </View>
                {notes.trim() && (
                  <>
                    <View style={styles.reviewDivider} />
                    <View style={styles.reviewRow}>
                      <Text variant="caption" color="muted">
                        Notes
                      </Text>
                      <Text variant="label" style={styles.reviewNotes}>
                        {notes.trim()}
                      </Text>
                    </View>
                  </>
                )}
              </Card>

              <View style={styles.warningBox}>
                <Ionicons name="information-circle-outline" size={16} color={theme.warning} />
                <Text variant="caption" style={{ ...styles.warningText, color: theme.warning }}>
                  Withdrawals are reviewed by our team and processed within 1-3 business days.
                </Text>
              </View>

              {biometricEnabled && (
                <View style={styles.biometricNotice}>
                  <Ionicons name="finger-print-outline" size={16} color={theme.textMuted} />
                  <Text variant="caption" color="muted">
                    {biometricLabel} will be required to confirm.
                  </Text>
                </View>
              )}
            </View>
          )}
        </ScrollView>

        {/* ── Footer actions ── */}
        <View style={styles.footer}>
          {step === 1 && (
            <Button
              onPress={handleNext}
              disabled={!selectedFund || !amount || funds.length === 0}
              fullWidth
              size="lg"
            >
              Continue
            </Button>
          )}
          {step === 2 && (
            <>
              <Button variant="outline" onPress={handleBack} style={styles.footerSecondary}>
                Back
              </Button>
              <Button
                onPress={handleSubmit}
                loading={submitting}
                disabled={submitting}
                style={styles.footerPrimary}
                size="lg"
              >
                {biometricEnabled ? `Confirm with ${biometricLabel}` : 'Submit Request'}
              </Button>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function makeStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: theme.background,
    },
    centered: {
      justifyContent: 'center',
      alignItems: 'center',
      gap: 16,
    },
    keyboardView: {
      flex: 1,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.border,
    },
    backBtn: {
      padding: 4,
    },
    modalTitle: {
      flex: 1,
      textAlign: 'center',
      color: theme.text,
    },
    headerSpacer: {
      width: 32,
    },
    stepIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 24,
      paddingVertical: 16,
    },
    stepItem: {
      alignItems: 'center',
      gap: 4,
    },
    stepDot: {
      width: 28,
      height: 28,
      borderRadius: 14,
      justifyContent: 'center',
      alignItems: 'center',
    },
    stepNumber: {
      fontWeight: '700',
      fontSize: 12,
    },
    stepLine: {
      flex: 1,
      height: 2,
      marginBottom: 20,
      marginHorizontal: 4,
    },
    scroll: {
      paddingHorizontal: 16,
      paddingBottom: 16,
    },
    stepContent: {
      gap: 16,
      paddingTop: 8,
    },
    stepTitle: {
      color: theme.text,
    },
    stepSubtitle: {
      marginTop: -8,
    },
    fundList: {
      gap: 10,
    },
    fundCard: {
      borderRadius: 12,
      borderWidth: 1.5,
      backgroundColor: theme.surface,
      padding: 14,
    },
    fundCardContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    fundIcon: {
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: 'center',
      alignItems: 'center',
    },
    fundInfo: {
      flex: 1,
      gap: 2,
    },
    noFunds: {
      alignItems: 'center',
      paddingVertical: 40,
      gap: 12,
    },
    amountSection: {
      gap: 10,
    },
    amountLabelRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    reviewCard: {
      gap: 0,
    },
    reviewRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
    },
    reviewDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: theme.border,
    },
    reviewNotes: {
      flex: 1,
      textAlign: 'right',
      marginLeft: 16,
    },
    warningBox: {
      flexDirection: 'row',
      gap: 8,
      padding: 12,
      backgroundColor: `${theme.warning}15`,
      borderRadius: 10,
      alignItems: 'flex-start',
    },
    warningText: {
      flex: 1,
    },
    biometricNotice: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      padding: 12,
      backgroundColor: theme.surface,
      borderRadius: 10,
    },
    footer: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      paddingVertical: 16,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.border,
      gap: 10,
    },
    footerSecondary: {
      flex: 1,
    },
    footerPrimary: {
      flex: 2,
    },
    errorMsg: {
      textAlign: 'center',
      marginVertical: 12,
    },
  });
}
