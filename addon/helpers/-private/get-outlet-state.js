import { setInternalHelperManager } from '@glimmer/manager';
import { createComputeRef } from '@glimmer/reference';

export default setInternalHelperManager(function (args, owner, scope) {
  return createComputeRef(() => {
    // args; owner; scope; debugger
    const outletState = scope?.outletState?.compute?.();

    return outletState || null;
  });
}, {});
