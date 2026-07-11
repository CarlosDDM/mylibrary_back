import { dataSourceOptions } from 'src/database/data-source.database';
import { DataSource, DataSourceOptions } from 'typeorm';
import { runSeeders, SeederOptions } from 'typeorm-extension';
import { MainSeeder } from './main.seeder';
import { AdminSeeder } from './admin.seeder';

const options: DataSourceOptions & SeederOptions = {
  ...dataSourceOptions,
  seeds: [MainSeeder, AdminSeeder],
};

const datasource = new DataSource(options);

datasource
  .initialize()
  .then(async () => {
    await runSeeders(datasource);
    process.exit();
  })
  .catch((err) => {
    console.error('Erro ao entrar executar o seeder', err);
    process.exit();
  });
