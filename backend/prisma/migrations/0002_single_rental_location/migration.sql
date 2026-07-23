ALTER TABLE "Vehicle"
ALTER COLUMN "pickupLocation"
SET DEFAULT 'Số 87A Nguyễn Công Trứ, Phường La Gi, Tỉnh Lâm Đồng';

UPDATE "Vehicle"
SET
  "pickupLocation" = 'Số 87A Nguyễn Công Trứ, Phường La Gi, Tỉnh Lâm Đồng',
  "latitude" = 10.682576018764667,
  "longitude" = 107.75848360972678;
