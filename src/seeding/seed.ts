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
    process.exit(0);
  })
  .catch((err) => {
    // Sair com 1 é o que faz o `set -e` do entrypoint.sh derrubar o start.
    // Com exit code 0 o container subia normalmente com o banco incompleto.
    console.error('Erro ao executar o seeder', err);
    process.exit(1);
  });
