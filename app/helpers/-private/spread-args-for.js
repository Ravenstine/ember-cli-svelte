import { setInternalHelperManager } from '@glimmer/manager';
import { createComputeRef, createPrimitiveRef } from '@glimmer/reference';
import { reifyPositional } from '@glimmer/runtime';
import { curry } from '@glimmer/runtime';

export default setInternalHelperManager(function ({ positional }, owner) {
  return createComputeRef(() => {
    const [componentName, hash = {}] = reifyPositional(positional);

    if (typeof componentName !== 'string') return;

    const named = Object.entries(hash).reduce((hash, [key, value]) => {
      hash[key] = createPrimitiveRef(value);

      return hash;
    }, {});

    const args = {
      positional: [],
      named,
    };

    return curry(0, componentName, owner, args, false);
  });
}, {});
