import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../modules/users/entities/user.entity';
import { Category } from '../../modules/categories/entities/category.entity';
import { Role } from '../../common/enums/role.enum';

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: Number(process.env.DATABASE_PORT) || 5432,
  username: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'password',
  database: process.env.DATABASE_NAME || 'dauran2',
  entities: ['src/**/*.entity.ts'],
  synchronize: true,
});

async function seed() {
  await AppDataSource.initialize();
  console.log('DB connected');

  const userRepo = AppDataSource.getRepository(User);
  const categoryRepo = AppDataSource.getRepository(Category);

  const adminExists = await userRepo.findOne({ where: { username: 'admin' } });
  if (!adminExists) {
    await userRepo.save(userRepo.create({
      username: 'admin',
      fullName: 'Administrator',
      passwordHash: await bcrypt.hash('admin123', 12),
      role: Role.ADMIN,
    }));
    console.log('Admin yaratildi: admin / admin123');
  }

  const managerExists = await userRepo.findOne({ where: { username: 'manager' } });
  if (!managerExists) {
    await userRepo.save(userRepo.create({
      username: 'manager',
      fullName: 'Menejer',
      passwordHash: await bcrypt.hash('manager123', 12),
      role: Role.MANAGER,
    }));
    console.log('Menejer yaratildi: manager / manager123');
  }

  const cashierExists = await userRepo.findOne({ where: { username: 'kassir' } });
  if (!cashierExists) {
    await userRepo.save(userRepo.create({
      username: 'kassir',
      fullName: 'Kassir Ismoilov',
      passwordHash: await bcrypt.hash('kassir123', 12),
      role: Role.CASHIER,
    }));
    console.log('Kassir yaratildi: kassir / kassir123');
  }

  const categories = [
    'Non-pisiriqlar', 'Sut mahsulotlari', 'Go\'sht mahsulotlari',
    'Meva-sabzavot', 'Ichimliklar', 'Saqich va shirinliklar',
    'Un va don', 'Yog\' va souslar', 'Baliq', 'Muzqaymoq',
  ];

  for (const name of categories) {
    const exists = await categoryRepo.findOne({ where: { name } });
    if (!exists) {
      await categoryRepo.save(categoryRepo.create({ name }));
      console.log(`Kategoriya: ${name}`);
    }
  }

  console.log('\nSeed muvaffaqiyatli yakunlandi!');
  await AppDataSource.destroy();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
