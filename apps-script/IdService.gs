var ID_WIDTHS_ = { ITM:4, EIT:4, LREQ:4, RL:4, RSV:4, LND:4, REL:4, RST:4, DEL:4, CAN:4, SUP:4, EVD:4, TXN:4, HIS:4, AUD:4, ERR:4, MAP:4 };
function allocateId_(prefix, options) {
  options = options || {}; var year = options.year === false ? '' : Utilities.formatDate(new Date(), HAU_CONFIG.TIMEZONE, 'yyyy'); var key = 'ID_COUNTER_' + prefix + (year ? '_' + year : '');
  var properties = PropertiesService.getScriptProperties(), next = Number(properties.getProperty(key) || 0) + 1; properties.setProperty(key, String(next));
  var suffix = String(next).padStart(ID_WIDTHS_[prefix] || 4, '0'); return prefix + '-' + (year ? year + '-' : '') + suffix;
}
function allocateEventItemId_(eventId) { var event = findOne_(HAU_SHEETS.EVENTS, 'Event_ID', eventId), code = sanitizeSystemToken_(event && event.Series_Code || 'EVENT').slice(0, 8), key='ID_COUNTER_EIT_'+code, properties=PropertiesService.getScriptProperties(), next=Number(properties.getProperty(key)||0)+1; properties.setProperty(key,String(next)); return 'EIT-' + code + '-' + String(next).padStart(4, '0'); }
