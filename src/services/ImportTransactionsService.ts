import { getCustomRepository, getRepository, In } from 'typeorm';
import csvParse from 'csv-parse';
import fs from 'fs';
import path from 'path';
import Transaction from '../models/Transaction';
// import CreateTransactionService from './CreateTransactionService';
import TransactionRepository from '../repositories/TransactionsRepository';

import Category from '../models/Category';

import uploadConfig from '../config/upload';

interface RequestDTO {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

class ImportTransactionsService {
  async execute(filename: string): Promise<Transaction[]> {
    const transactions: RequestDTO[] = [];
    const categories: string[] = [];

    const transactionsRepository = getCustomRepository(TransactionRepository);
    const categoriesRepository = getRepository(Category);

    const csvPathAndFile = path.join(uploadConfig.directory, filename);

    const readTransactions = fs.createReadStream(csvPathAndFile, {
      encoding: 'utf8',
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const parseStream = csvParse({
      ltrim: true,
      rtrim: true,
      delimiter: ',',
      auto_parse: true,
      columns: true,
    });
    const parseStream2 = csvParse({
      from_line: 2,
    });

    const parseCSV = readTransactions.pipe(parseStream2);

    parseCSV.on('data', async line => {
      const [title, type, value, category] = line.map((cell: string) =>
        cell.trim(),
      );

      if (!title || !type || !value) return null;

      transactions.push({ title, type, value, category });
      categories.push(category);
    });

    await new Promise(resolve => parseCSV.on('end', resolve));

    const existentCategories = await categoriesRepository.find({
      where: {
        title: In(categories),
      },
    });

    const existentCategoriesTitles = existentCategories.map(
      (category: Category) => category.title,
    );

    const addCategoriesTitle = categories
      .filter(category => !existentCategoriesTitles.includes(category))
      .filter((value, index, self) => self.indexOf(value) === index);

    const newCategories = categoriesRepository.create(
      addCategoriesTitle.map(title => ({
        title,
      })),
    );

    await categoriesRepository.save(newCategories);

    const finalCategories = [...newCategories, ...existentCategories];

    const newTransactions = transactionsRepository.create(
      transactions.map(transaction => ({
        title: transaction.title,
        type: transaction.type,
        value: transaction.value,
        category: finalCategories.find(
          category => category.title === transaction.category,
        ),
      })),
    );

    await transactionsRepository.save(newTransactions);

    // remove
    if (csvPathAndFile) {
      await fs.promises.unlink(csvPathAndFile);
    }

    return newTransactions;
  }
}

export default ImportTransactionsService;
