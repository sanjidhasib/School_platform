db.schoolsettings.updateOne(
  {},
  {
    $set: {
      name: 'Barishal Zilla School',
      address: 'Sadar Road, Barishal Sadar, Barishal-8200, Bangladesh',
      contactPhone: '+880-431-21734',
      contactEmail: 'info@barishal-zillaschool.edu.bd',
    },
  }
);
print(JSON.stringify(db.schoolsettings.findOne({}, { name: 1, address: 1, contactPhone: 1, contactEmail: 1 })));
