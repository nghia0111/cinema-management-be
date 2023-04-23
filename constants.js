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

const roomStatus = {
  ACTIVE: "Đang dùng",
  NONACTIVE: "Tạm nghỉ"
}

const movieStatus = {
  ACTIVE: "Đang chiếu",
  NONACTIVE: "Tạm nghỉ",
};

const postStatus = {
  DRAFT: "Bản nháp",
  PUBLIC: "Công khai"
}

module.exports = {
  userRoles,
  userStatus,
  genders,
  seatTypes,
  roomStatus,
  movieStatus,
  postStatus,
};
