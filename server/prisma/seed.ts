import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const [customerPassword, adminPassword] = await Promise.all([
    bcrypt.hash("password123", 10),
    bcrypt.hash("admin12345", 10)
  ]);

  const admin = await prisma.user.upsert({
    where: { email: "admin@autoparts.test" },
    update: {},
    create: {
      name: "Admin Manager",
      email: "admin@autoparts.test",
      passwordHash: adminPassword,
      phone: "+254 700 000 001",
      address: "Nairobi Service Hub",
      role: Role.ADMIN
    }
  });

  const customer = await prisma.user.upsert({
    where: { email: "customer@autoparts.test" },
    update: {},
    create: {
      name: "Amina Kamau",
      email: "customer@autoparts.test",
      passwordHash: customerPassword,
      phone: "+254 700 000 002",
      address: "Kilimani, Nairobi",
      role: Role.USER
    }
  });

  await prisma.cartItem.deleteMany({ where: { userId: customer.id } });
  await prisma.order.deleteMany({ where: { userId: customer.id } });
  await prisma.vehicle.deleteMany({ where: { userId: customer.id } });

  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: "engine" },
      update: {},
      create: {
        name: "Engine",
        slug: "engine",
        description: "Filters, plugs, belts, pumps, and other engine service parts."
      }
    }),
    prisma.category.upsert({
      where: { slug: "brakes" },
      update: {},
      create: {
        name: "Brakes",
        slug: "brakes",
        description: "Brake pads, rotors, drums, shoes, and hydraulic components."
      }
    }),
    prisma.category.upsert({
      where: { slug: "suspension" },
      update: {},
      create: {
        name: "Suspension",
        slug: "suspension",
        description: "Shocks, struts, bushings, control arms, and stabilizer links."
      }
    }),
    prisma.category.upsert({
      where: { slug: "electrical" },
      update: {},
      create: {
        name: "Electrical",
        slug: "electrical",
        description: "Batteries, alternators, bulbs, sensors, and switches."
      }
    })
  ]);

  const categoryBySlug = Object.fromEntries(categories.map((category) => [category.slug, category]));

  await prisma.product.createMany({
    data: [
      {
        categoryId: categoryBySlug.engine.id,
        name: "Oil Filter Z418",
        brand: "Bosch",
        compatibleMakes: ["Toyota", "Nissan"],
        compatibleModels: ["Corolla", "Axio", "Tiida"],
        compatibleYears: [2012, 2013, 2014, 2015, 2016, 2017, 2018],
        price: 12.99,
        stockQuantity: 42,
        description: "High-flow spin-on oil filter for common compact Japanese engines.",
        imageUrl: ""
      },
      {
        categoryId: categoryBySlug.brakes.id,
        name: "Front Brake Pad Set",
        brand: "Brembo",
        compatibleMakes: ["Toyota"],
        compatibleModels: ["Corolla", "Fielder", "Axio"],
        compatibleYears: [2010, 2011, 2012, 2013, 2014, 2015],
        price: 48.5,
        stockQuantity: 18,
        description: "Ceramic front brake pads with low dust and quiet stopping performance.",
        imageUrl: ""
      },
      {
        categoryId: categoryBySlug.suspension.id,
        name: "Rear Shock Absorber Pair",
        brand: "KYB",
        compatibleMakes: ["Subaru"],
        compatibleModels: ["Forester", "Impreza"],
        compatibleYears: [2014, 2015, 2016, 2017, 2018],
        price: 162,
        stockQuantity: 9,
        description: "Gas-charged rear shock absorber pair for daily comfort and stability.",
        imageUrl: ""
      },
      {
        categoryId: categoryBySlug.electrical.id,
        name: "DIN66 Maintenance-Free Battery",
        brand: "Varta",
        compatibleMakes: ["Toyota", "Mazda", "Nissan", "Subaru"],
        compatibleModels: ["Corolla", "CX-5", "X-Trail", "Forester"],
        compatibleYears: [2014, 2015, 2016, 2017, 2018, 2019, 2020],
        price: 132.75,
        stockQuantity: 15,
        description: "Reliable maintenance-free battery for petrol and diesel vehicles.",
        imageUrl: ""
      },
      {
        categoryId: categoryBySlug.engine.id,
        name: "Iridium Spark Plug Set",
        brand: "NGK",
        compatibleMakes: ["Toyota", "Mazda"],
        compatibleModels: ["Corolla", "Premio", "Demio"],
        compatibleYears: [2011, 2012, 2013, 2014, 2015, 2016],
        price: 39.99,
        stockQuantity: 30,
        description: "Four iridium spark plugs for smoother starts and better combustion.",
        imageUrl: ""
      }
    ],
    skipDuplicates: true
  });

  const corolla = await prisma.vehicle.create({
    data: {
      userId: customer.id,
      make: "Toyota",
      model: "Corolla",
      year: 2015,
      registrationNumber: "KDA 123A",
      vin: "NZE161-1234567",
      engineNumber: "1NZ-7654321",
      mileage: 126500,
      fuelType: "Petrol",
      transmissionType: "Automatic",
      notes: "Family daily driver. Prioritize genuine service parts.",
      repairs: {
        create: [
          {
            title: "Front brake service",
            description: "Replaced front brake pads and cleaned caliper sliders.",
            dateOfRepair: new Date("2025-11-10"),
            mileageAtRepair: 119800,
            partsUsed: ["Front Brake Pad Set", "Brake cleaner"],
            mechanicName: "Kilimani Auto Care",
            cost: 86.5,
            receiptUrl: "",
            nextServiceDate: new Date("2026-05-10")
          },
          {
            title: "Oil and filter change",
            description: "Changed engine oil and replaced oil filter.",
            dateOfRepair: new Date("2026-02-15"),
            mileageAtRepair: 124200,
            partsUsed: ["Oil Filter Z418", "5W-30 engine oil"],
            mechanicName: "Westlands Garage",
            cost: 54.25,
            receiptUrl: "",
            nextServiceDate: new Date("2026-08-15")
          }
        ]
      }
    }
  });

  await prisma.vehicle.create({
    data: {
      userId: customer.id,
      make: "Subaru",
      model: "Forester",
      year: 2017,
      registrationNumber: "KDG 455B",
      vin: "SJ5-7654321",
      engineNumber: "FB20-448899",
      mileage: 90400,
      fuelType: "Petrol",
      transmissionType: "CVT",
      notes: "Weekend vehicle. Monitor suspension noise."
    }
  });

  const products = await prisma.product.findMany({ take: 2 });
  if (products.length > 0) {
    const total = products.reduce((sum, product) => sum + Number(product.price), 0);
    await prisma.order.create({
      data: {
        userId: customer.id,
        status: "PROCESSING",
        total,
        shippingName: customer.name,
        shippingPhone: customer.phone,
        shippingAddress: customer.address ?? "Kilimani, Nairobi",
        items: {
          create: products.map((product) => ({
            productId: product.id,
            productName: product.name,
            brand: product.brand,
            unitPrice: product.price,
            quantity: 1
          }))
        }
      }
    });
  }

  console.log(`Seeded AutoParts & Repair Tracker with admin ${admin.email} and vehicle ${corolla.registrationNumber}.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
