-- Admin-controlled seasonal theme for the public site.
--
-- "off" is the default so an upgrade never changes how the site looks; a
-- season only appears once someone picks it in the admin panel. Values are
-- validated in the application rather than by a constraint, so adding next
-- year's season is a code change and not a migration.

ALTER TABLE platform_settings
  ADD COLUMN IF NOT EXISTS seasonal_theme VARCHAR DEFAULT 'off';

-- Existing rows predate the column and come back NULL, which would read as
-- "no season chosen" rather than "default theme".
UPDATE platform_settings SET seasonal_theme = 'off' WHERE seasonal_theme IS NULL;
