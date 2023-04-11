import type { Nullable } from '@mmo/shared';
import type { Ref } from 'vue';

export const useTimePicker = (date: Ref<Nullable<Date>>, target: Ref<any>) => {
  const dayjs = useDayjs();
  const formatTimeString = (date: Nullable<Date>) => {
    const d = dayjs(date);
    const hour = date ? d.hour().toString().padStart(2, '0') : '';
    const minutes = date ? d.minute().toString().padStart(2, '0') : '';
    const separator = minutes.length || hour.length == 2 ? ':' : '';

    return `${hour}${separator}${minutes}`;
  };

  const parseTimeString = (str: string, date: Nullable<Date>) => {
    const [hour, minutes] = str.split(':');

    const d = dayjs(date).hour(parseInt(hour!)).minute(parseInt(minutes!));
    return new Date(d.valueOf());
  };

  return computed({
    get() {
      return formatTimeString(date.value);
    },
    set(val: string) {
      target.value = parseTimeString(val, date.value);
    }
  });
};
