export function canAccessInventory(user) {
  const role = String(
    user?.user_role ?? localStorage.getItem("user_role") ?? "",
  ).toLowerCase();
  return role === "admin" || role === "superadmin";
}
