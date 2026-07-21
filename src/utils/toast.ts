import { notify } from './notify';

function toast(msg: string, opts?: { id?: string }) {
  return notify(msg, { ...opts, toast: true });
}
toast.success = (msg: string, opts?: { id?: string }) =>
  notify.success(msg, { ...opts, toast: true });
toast.error = (msg: string, opts?: { id?: string }) =>
  notify.error(msg, { ...opts, toast: true });
toast.warning = (msg: string, opts?: { id?: string }) =>
  notify.warning(msg, { ...opts, toast: true });
toast.info = (msg: string, opts?: { id?: string }) =>
  notify.info(msg, { ...opts, toast: true });

toast.loading = notify.loading;
toast.dismiss = notify.dismiss;
toast.clear = notify.clear;
toast.promise = notify.promise;

export { toast };
