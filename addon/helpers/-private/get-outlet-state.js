import { setInternalHelperManager } from '@glimmer/manager';
import { createComputeRef } from '@glimmer/reference';

export default setInternalHelperManager(function (args, owner, scope) {
  const outletState = scope?.outletState?.compute();

  return createComputeRef(() => {
    return outletState || null;
  });
}, {});
