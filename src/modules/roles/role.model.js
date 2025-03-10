const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  permissions: [{type:String}],
  isActive: { type: Boolean, default: true },
},{
    timestamps: true,
});

const Role = mongoose.model('Role', roleSchema);

module.exports = Role;
