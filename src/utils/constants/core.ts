import { create } from "@bufbuild/protobuf";

import {
  ConstraintSchema,
  ConstraintType,
  MagicConstant,
} from "@/proto/constraint_pb";
import { ParameterConstraintSchema } from "@/proto/parameter_constraint_pb";
import { Effect, RuleSchema, TargetSchema, TargetType } from "@/proto/rule_pb";

export const feeAppRules = [
  create(RuleSchema, {
    constraints: {},
    description: "native fee transfer to vultisig treasury",
    effect: Effect.ALLOW,
    id: "native fee transfer",
    parameterConstraints: [
      create(ParameterConstraintSchema, {
        constraint: create(ConstraintSchema, {
          required: true,
          type: ConstraintType.MAGIC_CONSTANT,
          value: {
            case: "magicConstantValue",
            value: MagicConstant.VULTISIG_TREASURY,
          },
        }),
        parameterName: "recipient",
      }),
      create(ParameterConstraintSchema, {
        constraint: create(ConstraintSchema, {
          denominatedIn: "wei",
          required: true,
          type: ConstraintType.ANY,
        }),
        parameterName: "amount",
      }),
    ],
    resource: "ethereum.send",
    target: create(TargetSchema, {
      targetType: TargetType.ADDRESS,
      target: {
        case: "address",
        value: "0x0000000000000000000000000000000000000000",
      },
    }),
  }),
  create(RuleSchema, {
    constraints: {},
    description: "usdc fee transfer to vultisig treasury",
    effect: Effect.ALLOW,
    id: "usdc fee transfer",
    parameterConstraints: [
      create(ParameterConstraintSchema, {
        constraint: create(ConstraintSchema, {
          required: true,
          type: ConstraintType.MAGIC_CONSTANT,
          value: {
            case: "magicConstantValue",
            value: MagicConstant.VULTISIG_TREASURY,
          },
        }),
        parameterName: "recipient",
      }),
      create(ParameterConstraintSchema, {
        constraint: create(ConstraintSchema, {
          required: true,
          type: ConstraintType.ANY,
        }),
        parameterName: "amount",
      }),
    ],
    resource: "ethereum.send",
    target: create(TargetSchema, {
      targetType: TargetType.ADDRESS,
      target: {
        case: "address",
        value: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      },
    }),
  }),
  create(RuleSchema, {
    constraints: {},
    description: "fee swap to usdc",
    effect: Effect.ALLOW,
    id: "fee swap to usdc",
    parameterConstraints: [
      create(ParameterConstraintSchema, {
        constraint: create(ConstraintSchema, {
          required: true,
          type: ConstraintType.ANY,
        }),
        parameterName: "from_asset",
      }),
      create(ParameterConstraintSchema, {
        constraint: create(ConstraintSchema, {
          required: true,
          type: ConstraintType.FIXED,
          value: {
            case: "fixedValue",
            value: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
          },
        }),
        parameterName: "to_asset",
      }),
      create(ParameterConstraintSchema, {
        constraint: create(ConstraintSchema, {
          required: true,
          type: ConstraintType.ANY,
        }),
        parameterName: "from_address",
      }),
      create(ParameterConstraintSchema, {
        constraint: create(ConstraintSchema, {
          required: true,
          type: ConstraintType.MAGIC_CONSTANT,
          value: {
            case: "magicConstantValue",
            value: MagicConstant.VULTISIG_TREASURY,
          },
        }),
        parameterName: "to_address",
      }),
      create(ParameterConstraintSchema, {
        constraint: create(ConstraintSchema, {
          required: true,
          type: ConstraintType.ANY,
        }),
        parameterName: "from_amount",
      }),
      create(ParameterConstraintSchema, {
        constraint: create(ConstraintSchema, {
          required: true,
          type: ConstraintType.FIXED,
          value: { case: "fixedValue", value: "3" },
        }),
        parameterName: "to_chain",
      }),
    ],
    resource: "ethereum.swap",
    target: create(TargetSchema, {
      targetType: TargetType.ADDRESS,
      target: {
        case: "address",
        value: "0x111111125421cA6dc452d289314280a0f8842A65",
      },
    }),
  }),
];

export const modalHash = {
  currency: "#currency",
  language: "#language",
  payment: "#payment",
  policy: "#policy",
  requirements: "#requirements",
  review: "#review",
} as const;

export const PAGE_SIZE = 12;
