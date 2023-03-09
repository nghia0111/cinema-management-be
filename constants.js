/**
 * Define enum for models
 */

// User Roles
const userRoles = {
  OWNER: "Chủ rạp",
  MANAGER: "Quản lý",
  STAFF: "Nhân viên",
  CUSTOMER: "Khách hàng"
};

// User status
const userStatus = {
  ACTIVE: "Đang làm",
  NONACTIVE: "Đã nghỉ",
};

const genders = {
  MALE: "Nam",
  FEMALE: "Nữ",
  OTHER: "Khác"
}

const seatTypes = {
  SINGLE: "Ghế đơn",
  DOUBLE: "Ghế đôi",
  NONE: "Trống",
};

module.exports = {
  userRoles,
  userStatus,
  genders,
  seatTypes
};
