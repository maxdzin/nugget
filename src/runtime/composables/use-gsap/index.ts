import {
  type MaybeRefOrGetter,
  watchPostEffect,
  toValue,
  tryOnScopeDispose,
  createEventHook,
  tryOnMounted,
} from "#imports";
import "gsap";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import type { Ease } from "../types";
import type { EventHookOn } from "@vueuse/core";

type EaseOption = {
  /** The ease of the tween
   * @remarks
   * - `Ease` is a custom type that allows the LSP to infer the correct string values for `ease`
   * - You can also pass a custom `gsap.EaseFunction`
   * */
  ease?: Ease | gsap.EaseFunction;
};

/** Strongly typed TweenVars */
export type StrongTweenVars = gsap.TweenVars & EaseOption;

/** Strongly typed TimelineVars */
export type StrongTimelineVars = gsap.TimelineVars & EaseOption;

/** Function to activate the tween on mount
 * @param el - The element to tween
 * @param updateFactory - The update function to run on mount
 * */
const activationFn = (
  el: MaybeRefOrGetter<gsap.TweenTarget | undefined>,
  tween: gsap.core.Tween | undefined,
  updateFactory: (el: gsap.TweenTarget | undefined) => void,
) => {
  const updateFn = () => updateFactory(toValue(el));
  watchPostEffect(updateFn);

  tryOnScopeDispose(() => tween?.kill());
};

/** Composable to use gsap
 * @param plugins - The plugins to register to gsap
 * @remarks
 * - This is a composable to make it easier to use gsap with Vue
 * - It also allows the LSP to infer the correct types for `gsap`
 * - It registers `ScrollTrigger` by default
 * */
function useGsap(plugins: object[] = [ScrollTrigger]) {
  gsap.registerPlugin(...plugins);
  return {
    gsap,

    timeline: (vars?: StrongTimelineVars) => {
      const tl = gsap.timeline(vars);

      const onMount = createEventHook<gsap.core.Timeline>();

      tryOnMounted(() => onMount.trigger(tl));

      onMount.off((tl) => tl.kill());

      return {
        tl,
        tlFn: onMount.on as EventHookOn<gsap.core.Timeline>,
        play: () => tl.play(),
        pause: () => tl.pause(),
        restart: () => tl.restart(),
        resume: () => tl.resume(),
        progress: (value: number) => tl.progress(value),
        seek: (value: number | string) => tl.seek(value),
        isActive: () => tl.isActive(),
      };
    },

    set: (
      target: MaybeRefOrGetter<gsap.TweenTarget>,
      vars: StrongTweenVars,
    ) => {
      let tween: gsap.core.Tween | undefined;
      activationFn(target, tween, (el) => {
        if (!el) return;
        tween = gsap.set(el, vars);
      });
      return tween;
    },

    fromTo: (
      target: MaybeRefOrGetter<gsap.TweenTarget | undefined>,
      options: { from: StrongTweenVars; to: StrongTweenVars },
    ) => {
      let tween: gsap.core.Tween | undefined;
      activationFn(target, tween, (el) => {
        if (!el) return;
        tween = gsap.fromTo(el, options.from, options.to);
      });
      return tween;
    },

    to: (target: MaybeRefOrGetter<gsap.TweenTarget>, vars: StrongTweenVars) => {
      let tween: gsap.core.Tween | undefined;
      activationFn(target, tween, (el) => {
        if (!el) return;
        tween = gsap.to(el, vars);
      });
      return tween;
    },

    from: (
      target: MaybeRefOrGetter<gsap.TweenTarget>,
      vars: StrongTweenVars,
    ) => {
      let tween: gsap.core.Tween | undefined;
      activationFn(target, tween, (el) => {
        if (!el) return;
        tween = gsap.from(el, vars);
      });
      return tween;
    },
  };
}

export default useGsap;

export type UseGsapReturn = ReturnType<typeof useGsap>;
