import 'package:hive/hive.dart';

import 'product.dart';

const int productTypeId = 1;

class ProductAdapter extends TypeAdapter<Product> {
  @override
  final int typeId = productTypeId;

  @override
  Product read(BinaryReader reader) {
    final fields = <int, dynamic>{
      for (int i = 0, count = reader.readByte(); i < count; i++)
        reader.readByte(): reader.read(),
    };
    return Product(
      id: fields[0] as int,
      name: fields[1] as String,
      variant: fields[2] as String,
      price: fields[3] as double,
      description: fields[4] as String,
      imageAsset: fields[5] as String,
      location: fields[6] as String,
      rating: fields[7] as double,
      isAvailable: fields[8] as bool,
    );
  }

  @override
  void write(BinaryWriter writer, Product obj) {
    writer
      ..writeByte(9)
      ..writeByte(0)
      ..write(obj.id)
      ..writeByte(1)
      ..write(obj.name)
      ..writeByte(2)
      ..write(obj.variant)
      ..writeByte(3)
      ..write(obj.price)
      ..writeByte(4)
      ..write(obj.description)
      ..writeByte(5)
      ..write(obj.imageAsset)
      ..writeByte(6)
      ..write(obj.location)
      ..writeByte(7)
      ..write(obj.rating)
      ..writeByte(8)
      ..write(obj.isAvailable);
  }
}
