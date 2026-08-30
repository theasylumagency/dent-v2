import * as migration_20260814_060953 from './20260814_060953';
import * as migration_20260814_074837 from './20260814_074837';
import * as migration_20260814_075438 from './20260814_075438';
import * as migration_20260814_080614 from './20260814_080614';
import * as migration_20260814_091822 from './20260814_091822';
import * as migration_20260815_193656 from './20260815_193656';
import * as migration_20260820_063311_analytics_consent_audit from './20260820_063311_analytics_consent_audit';
import * as migration_20260821_064018_campaign_landing_pages from './20260821_064018_campaign_landing_pages';
import * as migration_20260821_090027_landing_pages_simplified from './20260821_090027_landing_pages_simplified';
import * as migration_20260827_133147_booking_requests from './20260827_133147_booking_requests';
import * as migration_20260828_101500_audit_document_label from './20260828_101500_audit_document_label';

export const migrations = [
  {
    up: migration_20260814_060953.up,
    down: migration_20260814_060953.down,
    name: '20260814_060953',
  },
  {
    up: migration_20260814_074837.up,
    down: migration_20260814_074837.down,
    name: '20260814_074837',
  },
  {
    up: migration_20260814_075438.up,
    down: migration_20260814_075438.down,
    name: '20260814_075438',
  },
  {
    up: migration_20260814_080614.up,
    down: migration_20260814_080614.down,
    name: '20260814_080614',
  },
  {
    up: migration_20260814_091822.up,
    down: migration_20260814_091822.down,
    name: '20260814_091822',
  },
  {
    up: migration_20260815_193656.up,
    down: migration_20260815_193656.down,
    name: '20260815_193656',
  },
  {
    up: migration_20260820_063311_analytics_consent_audit.up,
    down: migration_20260820_063311_analytics_consent_audit.down,
    name: '20260820_063311_analytics_consent_audit',
  },
  {
    up: migration_20260821_064018_campaign_landing_pages.up,
    down: migration_20260821_064018_campaign_landing_pages.down,
    name: '20260821_064018_campaign_landing_pages',
  },
  {
    up: migration_20260821_090027_landing_pages_simplified.up,
    down: migration_20260821_090027_landing_pages_simplified.down,
    name: '20260821_090027_landing_pages_simplified',
  },
  {
    up: migration_20260827_133147_booking_requests.up,
    down: migration_20260827_133147_booking_requests.down,
    name: '20260827_133147_booking_requests',
  },
  {
    up: migration_20260828_101500_audit_document_label.up,
    down: migration_20260828_101500_audit_document_label.down,
    name: '20260828_101500_audit_document_label'
  },
];
