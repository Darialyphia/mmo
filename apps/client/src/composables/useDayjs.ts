import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import weekday from 'dayjs/plugin/weekday';
import localeData from 'dayjs/plugin/localeData';
import utc from 'dayjs/plugin/utc';
import localizedFormat from 'dayjs/plugin/localizedFormat';

import 'dayjs/locale/fr';
import 'dayjs/locale/en';

dayjs.extend(isoWeek);
dayjs.extend(weekday);
dayjs.extend(localeData);
dayjs.extend(utc);
dayjs.extend(localizedFormat);

export const useDayjs = () => {
  const { locale } = useI18n();

  watchEffect(() => {
    dayjs.locale(locale.value);
  });
  return dayjs;
};
