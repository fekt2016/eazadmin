import { useOfficialStore } from './useOfficialStore';

/**
 * EazShop / Official Store hooks for admin.
 * useEazShop() returns hooks used by AllProductPage (useMarkProductAsEazShop)
 * and PickupCentersPage (useGetPickupCenters). These are aliases to useOfficialStore.
 */
export const useEazShop = () => {
  const officialStore = useOfficialStore();
  return {
    useGetPickupCenters: officialStore.useGetPickupCenters,
    useMarkProductAsEazShop: officialStore.useMarkProductAsOfficial,
  };
};

export default useEazShop;
