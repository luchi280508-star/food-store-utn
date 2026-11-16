function fail(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  throw error;
}
function string(value, field, required = true, max = 500) {
  if (value == null && !required) return '';
  if (typeof value !== 'string' || value.length > max || (required && !value.trim())) {
    fail('Revisá el campo ' + field + '.');
  }
  return value.trim();
}
function integer(value, field, min = 0, max = 100000000) {
  if (!(typeof value === 'number' || (typeof value === 'string' && /^\d+$/.test(value)))) fail('Revisá ' + field + '.');
  const n = Number(value);
  if (!Number.isSafeInteger(n) || n < min || n > max) fail('Revisá ' + field + '.');
  return n;
}
function bool(value) {
  if (typeof value !== 'boolean') fail('Revisá la opción seleccionada.');
  return value;
}
function email(value) {
  const result = string(value,'correo',true,254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result)) fail('Ingresá un correo válido.');
  return result;
}
function password(value) {
  if (typeof value !== 'string' || value.length < 8 || value.length > 128) fail('Usá entre 8 y 128 caracteres para la contraseña.');
  return value;
}
function requireRole(user,...roles) {
  if (!user) fail('Iniciá sesión para continuar.',401);
  if (!roles.includes(user.role)) fail('Tu cuenta no tiene acceso a esta función.',403);
}
module.exports = { fail, string, integer, bool, email, password, requireRole };
