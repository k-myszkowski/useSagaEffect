import { useEffect, useRef } from "react";

type SagaGenerator = Generator<any, any, boolean>;

enum EffectTypes {
  takeOnce = 'takeOnce',
};

type EffectType = {
  type: EffectTypes,
  payload: {
    dependency?: string,
  },
}

type EffectsMeta = {
  prevDependencies: Map<string, any>,
  canceledEffect?: EffectType,
}

export function take(dependency: string): EffectType {
  return {
    type: EffectTypes.takeOnce,
    payload: {
      dependency,
    }
  };
}

function* takeGenerator<DepsT extends Record<string, any>>(effect: EffectType, effectsMeta: EffectsMeta, deps: DepsT) {
  const {
    payload: {
      dependency,
    }
  } = effect;

  const {
    prevDependencies
  } = effectsMeta;

  const prevDependencyValue = prevDependencies.get(dependency as string);
  const hasPrevDependencyValue = prevDependencies.has(dependency as string);
  const currentValue = deps[dependency as string];
  prevDependencies.set(dependency as string, currentValue);
  console.log(dependency, prevDependencyValue, currentValue, !hasPrevDependencyValue, prevDependencyValue !== currentValue);

  if (!hasPrevDependencyValue || prevDependencyValue !== currentValue) {
    yield {
      cancel: false,
    };
  }

  yield {
    cancel: true,
  }

  return true;
}

function* effectGenerator<DepsT extends Record<string, any>>(effect: EffectType, effectsMeta: EffectsMeta, deps: DepsT) {

  if (effect.type === EffectTypes.takeOnce) {
    yield* takeGenerator(effect, effectsMeta, deps);
  }

  return true;
}

function executeEffect<DepsT extends Record<string, any>>(effect: EffectType, effectsMeta: EffectsMeta, deps: DepsT) {
  const generator = effectGenerator(effect, effectsMeta, deps);
  let nextResult: any;
  let isCanceled: boolean = false;
  while(!nextResult?.done) {
    nextResult = generator.next();
    console.log(nextResult.value);
    if (nextResult.value?.cancel !== undefined) {
      return nextResult.value?.cancel;
    }
  }

  return isCanceled;
}

function execute<DepsT extends Record<string, any>>(generator: SagaGenerator, effectsMeta: EffectsMeta, deps: DepsT, yieldValue?: any) {
  if (effectsMeta.canceledEffect) {
    const isCanceled = executeEffect(effectsMeta.canceledEffect, effectsMeta, deps);
    console.log('isCanceled', isCanceled);
    if (isCanceled) {
      return;
    }
    
  }
  
  const next = generator.next(yieldValue);

  const effect = next.value;
  const isCanceled = executeEffect(effect, effectsMeta, deps);
  console.log('isCanceled', isCanceled);
  if (isCanceled) {
    effectsMeta.canceledEffect = effect;
    return;
  }

  execute(generator, effectsMeta, deps , null);
  // next.value.then(
  //   result => execute(generator, result),
  //   err => generator.throw(err),
  // );

}


export const useSagaEffect = <DepsT extends Record<string, any>>(generatorFn: () => SagaGenerator, deps: DepsT) => {
  const generatorInternal = useRef(generatorFn());
  const effectsMeta = useRef<EffectsMeta>({
    prevDependencies: new Map<string, any>(),
  });
  console.log(Object.values(deps));
  useEffect(() => {
    console.log('useEffect', deps);
    execute(generatorInternal.current, effectsMeta.current, deps, null);
  }, [...Object.values(deps)]);
}

