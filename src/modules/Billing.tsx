"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
// Port of the Framer module Billing (7NzCl3u9vwk3Y52zzXcU/eeVmvcFIKoW94GUYfGZZ).
// Same external store and the same four wrappers. The pill border uses a token so it works in both themes.
import { forwardRef, useSyncExternalStore, type ComponentType } from "react";

let state = { yearly: false, touched: false };
const listeners = new Set<() => void>();
const subscribe = (fn: () => void) => { listeners.add(fn); return () => { listeners.delete(fn); }; };
const getState = () => state;
const setState = (patch: Partial<typeof state>) => { state = { ...state, ...patch }; listeners.forEach(fn => fn()); };
function useBilling() { return [useSyncExternalStore(subscribe, getState, getState), setState] as const; }
const DISCOUNT = 0.8;

function pill(active: boolean, style: any) {
  return {
    ...style,
    cursor: "pointer",
    backgroundColor: active ? "var(--token-gC336m1ca)" : "transparent",
    boxShadow: active ? "inset 0 0 0 1px var(--token-fqjRVkZi3)" : "inset 0 0 0 1px transparent",
    opacity: active ? 1 : 0.6,
    transition: "background-color 0.2s, box-shadow 0.2s, opacity 0.2s",
  };
}

export function withMonthly(Component: ComponentType<any> | string) {
  return forwardRef(function Monthly(props: any, ref) {
    const [s, set] = useBilling();
    const { style, ...rest } = props;
    return <Component {...rest} ref={ref} style={pill(!s.yearly, style)} role="button" aria-pressed={!s.yearly} onClick={() => set({ yearly: false, touched: true })} />;
  });
}
export function withYearly(Component: ComponentType<any> | string) {
  return forwardRef(function Yearly(props: any, ref) {
    const [s, set] = useBilling();
    const { style, ...rest } = props;
    return <Component {...rest} ref={ref} style={pill(s.yearly, style)} role="button" aria-pressed={s.yearly} onClick={() => set({ yearly: true, touched: true })} />;
  });
}
// On a LiveVisual counter: shows the monthly or yearly (discounted, per month) price.
export function withPlanPrice(Component: ComponentType<any>) {
  return function PlanPrice(props: any) {
    const [s] = useBilling();
    const monthly = Number(props.value ?? 0);
    const yearly = Math.round(monthly * DISCOUNT);
    const value = s.yearly ? yearly : monthly;
    const from = s.touched ? (s.yearly ? monthly : yearly) : props.from;
    return <Component {...props} value={value} from={from} key={s.yearly ? "y" : "m"} />;
  };
}
// On the "/ month" label next to a price.
export function withBillingPeriod(Component: ComponentType<any>) {
  return function BillingPeriod(props: any) {
    const [s] = useBilling();
    return <Component {...props} text={s.yearly ? props.yearlyText : props.text} />;
  };
}
