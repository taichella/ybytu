-- exercises.load_type: diz se (e como) um exercício usa carga em kg.
-- Pedido 2026-09-19: o staff podia digitar carga em exercício sem carga (achado:
-- 3 kg em "Good morning com peso corporal", -1 kg em flexão de braço, no plano
-- ativo de teste da Gisele) e a interface não tinha como saber o que mostrar.
--
--   bodyweight  peso do corpo / acessório / cardio  -> sem campo de carga em kg
--   weighted    peso livre (halter, barra, kettlebell, anilha) -> carga em kg
--   machine     máquina/polia                        -> carga em kg (pilha)
--   band        elástico                             -> sem kg (resistência por cor)
--
-- NOT NULL DEFAULT 'weighted': nenhum exercício fica sem classificação, e o
-- default escolhido é o lado SEGURO de errar. Um exercício novo (ou ainda não
-- classificado) que caia em 'weighted' mostra o campo de carga vazio ("a
-- definir") -- ruído visível, mas honesto. O contrário ('bodyweight' como
-- default) esconderia o campo de um exercício que precisa de carga e o aluno
-- voltaria a não saber com quanto peso treinar (a queixa original).
--
-- Preenchimento: 240 exercícios decididos por regra sobre exercise_equipments_ids
-- (halter/kettlebell/medicine ball = weighted; máquinas = machine; só elástico =
-- band; só peso corporal/acessórios/cardio = bodyweight) e 58 AMBÍGUOS
-- (barra/banco/hiperextensão admitem as duas leituras) com uma SUGESTÃO
-- PROVISÓRIA por nome, que o personal confirma em docs/CLASSIFICACAO_LOAD_TYPE.md.
-- Na dúvida a sugestão é 'weighted' (mesmo raciocínio do default).
--
-- Rollback: ALTER TABLE exercises DROP COLUMN load_type;  (nenhum código lê a
-- coluna antes desta migration ser aplicada e a interface ser atualizada.)

BEGIN;

ALTER TABLE exercises ADD COLUMN load_type text NOT NULL DEFAULT 'weighted';
ALTER TABLE exercises ADD CONSTRAINT exercises_load_type_check
  CHECK (load_type IN ('bodyweight', 'weighted', 'machine', 'band'));

-- bodyweight: 106 decididos pelo equipamento
UPDATE exercises SET load_type = 'bodyweight' WHERE exercise_id IN (
    'ex_001', 'ex_002', 'ex_003', 'ex_018', 'ex_019', 'ex_021', 'ex_022', 'ex_024', 'ex_032', 'ex_042', 'ex_043',
    'ex_044', 'ex_045', 'ex_046', 'ex_058', 'ex_059', 'ex_060', 'ex_061', 'ex_073', 'ex_074', 'ex_076', 'ex_084',
    'ex_091', 'ex_093', 'ex_094', 'ex_099', 'ex_103', 'ex_104', 'ex_105', 'ex_106', 'ex_107', 'ex_108', 'ex_109',
    'ex_113', 'ex_114', 'ex_116', 'ex_117', 'ex_118', 'ex_119', 'ex_120', 'ex_121', 'ex_125', 'ex_127', 'ex_129',
    'ex_132', 'ex_133', 'ex_135', 'ex_136', 'ex_137', 'ex_138', 'ex_139', 'ex_141', 'ex_147', 'ex_148', 'ex_151',
    'ex_152', 'ex_161', 'ex_162', 'ex_163', 'ex_174', 'ex_175', 'ex_185', 'ex_186', 'ex_187', 'ex_188', 'ex_194',
    'ex_216', 'ex_225', 'ex_235', 'ex_236', 'ex_237', 'ex_250', 'ex_263', 'ex_264', 'ex_265', 'ex_266', 'ex_267',
    'ex_268', 'ex_269', 'ex_270', 'ex_271', 'ex_272', 'ex_273', 'ex_274', 'ex_275', 'ex_276', 'ex_277', 'ex_278',
    'ex_279', 'ex_280', 'ex_281', 'ex_282', 'ex_283', 'ex_284', 'ex_286', 'ex_287', 'ex_288', 'ex_290', 'ex_292',
    'ex_293', 'ex_294', 'ex_295', 'ex_296', 'ex_297', 'ex_298', 'ex_299'
);

-- bodyweight: 17 AMBÍGUOS -- sugestão provisória, personal confirma
UPDATE exercises SET load_type = 'bodyweight' WHERE exercise_id IN (
    'ex_020', 'ex_023', 'ex_034', 'ex_038', 'ex_100', 'ex_123', 'ex_128', 'ex_145', 'ex_176', 'ex_203', 'ex_204',
    'ex_205', 'ex_223', 'ex_224', 'ex_246', 'ex_247', 'ex_248'
);

-- weighted: 60 decididos pelo equipamento
UPDATE exercises SET load_type = 'weighted' WHERE exercise_id IN (
    'ex_004', 'ex_005', 'ex_006', 'ex_012', 'ex_013', 'ex_016', 'ex_026', 'ex_030', 'ex_035', 'ex_039', 'ex_048',
    'ex_054', 'ex_057', 'ex_065', 'ex_066', 'ex_067', 'ex_068', 'ex_075', 'ex_082', 'ex_085', 'ex_086', 'ex_090',
    'ex_092', 'ex_095', 'ex_111', 'ex_112', 'ex_115', 'ex_126', 'ex_134', 'ex_146', 'ex_153', 'ex_154', 'ex_157',
    'ex_159', 'ex_173', 'ex_177', 'ex_179', 'ex_189', 'ex_190', 'ex_193', 'ex_195', 'ex_196', 'ex_197', 'ex_201',
    'ex_206', 'ex_207', 'ex_211', 'ex_212', 'ex_214', 'ex_217', 'ex_218', 'ex_222', 'ex_229', 'ex_233', 'ex_238',
    'ex_239', 'ex_254', 'ex_256', 'ex_285', 'ex_291'
);

-- weighted: 40 AMBÍGUOS -- sugestão provisória, personal confirma
UPDATE exercises SET load_type = 'weighted' WHERE exercise_id IN (
    'ex_010', 'ex_011', 'ex_014', 'ex_015', 'ex_017', 'ex_033', 'ex_036', 'ex_041', 'ex_051', 'ex_052', 'ex_055',
    'ex_056', 'ex_069', 'ex_070', 'ex_071', 'ex_072', 'ex_079', 'ex_080', 'ex_083', 'ex_089', 'ex_130', 'ex_131',
    'ex_156', 'ex_160', 'ex_170', 'ex_171', 'ex_172', 'ex_180', 'ex_181', 'ex_184', 'ex_191', 'ex_199', 'ex_200',
    'ex_202', 'ex_213', 'ex_221', 'ex_228', 'ex_230', 'ex_245', 'ex_259'
);

-- machine: 46 decididos pelo equipamento
UPDATE exercises SET load_type = 'machine' WHERE exercise_id IN (
    'ex_007', 'ex_008', 'ex_009', 'ex_027', 'ex_028', 'ex_029', 'ex_031', 'ex_049', 'ex_050', 'ex_053', 'ex_064',
    'ex_078', 'ex_081', 'ex_087', 'ex_088', 'ex_096', 'ex_097', 'ex_098', 'ex_101', 'ex_102', 'ex_143', 'ex_144',
    'ex_158', 'ex_167', 'ex_168', 'ex_169', 'ex_182', 'ex_183', 'ex_192', 'ex_208', 'ex_209', 'ex_210', 'ex_215',
    'ex_220', 'ex_227', 'ex_234', 'ex_241', 'ex_242', 'ex_243', 'ex_244', 'ex_253', 'ex_257', 'ex_258', 'ex_260',
    'ex_261', 'ex_262'
);

-- band: 28 decididos pelo equipamento
UPDATE exercises SET load_type = 'band' WHERE exercise_id IN (
    'ex_025', 'ex_040', 'ex_047', 'ex_062', 'ex_063', 'ex_077', 'ex_110', 'ex_122', 'ex_124', 'ex_140', 'ex_142',
    'ex_149', 'ex_155', 'ex_164', 'ex_165', 'ex_166', 'ex_178', 'ex_198', 'ex_219', 'ex_226', 'ex_231', 'ex_232',
    'ex_240', 'ex_249', 'ex_251', 'ex_252', 'ex_255', 'ex_289'
);

-- band: 1 AMBÍGUOS -- sugestão provisória, personal confirma
UPDATE exercises SET load_type = 'band' WHERE exercise_id IN (
    'ex_037'
);

-- Conferência: a soma tem que fechar 298 e nenhum exercício pode ficar de fora
-- do backfill (o DEFAULT 'weighted' cobriria um esquecido em silêncio).
DO $$
DECLARE n_total int; n_backfilled int;
BEGIN
  SELECT count(*) INTO n_total FROM exercises;
  SELECT count(*) INTO n_backfilled FROM exercises WHERE exercise_id IN (
    'ex_001', 'ex_002', 'ex_003', 'ex_004', 'ex_005', 'ex_006', 'ex_007', 'ex_008', 'ex_009', 'ex_010', 'ex_011',
    'ex_012', 'ex_013', 'ex_014', 'ex_015', 'ex_016', 'ex_017', 'ex_018', 'ex_019', 'ex_020', 'ex_021', 'ex_022',
    'ex_023', 'ex_024', 'ex_025', 'ex_026', 'ex_027', 'ex_028', 'ex_029', 'ex_030', 'ex_031', 'ex_032', 'ex_033',
    'ex_034', 'ex_035', 'ex_036', 'ex_037', 'ex_038', 'ex_039', 'ex_040', 'ex_041', 'ex_042', 'ex_043', 'ex_044',
    'ex_045', 'ex_046', 'ex_047', 'ex_048', 'ex_049', 'ex_050', 'ex_051', 'ex_052', 'ex_053', 'ex_054', 'ex_055',
    'ex_056', 'ex_057', 'ex_058', 'ex_059', 'ex_060', 'ex_061', 'ex_062', 'ex_063', 'ex_064', 'ex_065', 'ex_066',
    'ex_067', 'ex_068', 'ex_069', 'ex_070', 'ex_071', 'ex_072', 'ex_073', 'ex_074', 'ex_075', 'ex_076', 'ex_077',
    'ex_078', 'ex_079', 'ex_080', 'ex_081', 'ex_082', 'ex_083', 'ex_084', 'ex_085', 'ex_086', 'ex_087', 'ex_088',
    'ex_089', 'ex_090', 'ex_091', 'ex_092', 'ex_093', 'ex_094', 'ex_095', 'ex_096', 'ex_097', 'ex_098', 'ex_099',
    'ex_100', 'ex_101', 'ex_102', 'ex_103', 'ex_104', 'ex_105', 'ex_106', 'ex_107', 'ex_108', 'ex_109', 'ex_110',
    'ex_111', 'ex_112', 'ex_113', 'ex_114', 'ex_115', 'ex_116', 'ex_117', 'ex_118', 'ex_119', 'ex_120', 'ex_121',
    'ex_122', 'ex_123', 'ex_124', 'ex_125', 'ex_126', 'ex_127', 'ex_128', 'ex_129', 'ex_130', 'ex_131', 'ex_132',
    'ex_133', 'ex_134', 'ex_135', 'ex_136', 'ex_137', 'ex_138', 'ex_139', 'ex_140', 'ex_141', 'ex_142', 'ex_143',
    'ex_144', 'ex_145', 'ex_146', 'ex_147', 'ex_148', 'ex_149', 'ex_151', 'ex_152', 'ex_153', 'ex_154', 'ex_155',
    'ex_156', 'ex_157', 'ex_158', 'ex_159', 'ex_160', 'ex_161', 'ex_162', 'ex_163', 'ex_164', 'ex_165', 'ex_166',
    'ex_167', 'ex_168', 'ex_169', 'ex_170', 'ex_171', 'ex_172', 'ex_173', 'ex_174', 'ex_175', 'ex_176', 'ex_177',
    'ex_178', 'ex_179', 'ex_180', 'ex_181', 'ex_182', 'ex_183', 'ex_184', 'ex_185', 'ex_186', 'ex_187', 'ex_188',
    'ex_189', 'ex_190', 'ex_191', 'ex_192', 'ex_193', 'ex_194', 'ex_195', 'ex_196', 'ex_197', 'ex_198', 'ex_199',
    'ex_200', 'ex_201', 'ex_202', 'ex_203', 'ex_204', 'ex_205', 'ex_206', 'ex_207', 'ex_208', 'ex_209', 'ex_210',
    'ex_211', 'ex_212', 'ex_213', 'ex_214', 'ex_215', 'ex_216', 'ex_217', 'ex_218', 'ex_219', 'ex_220', 'ex_221',
    'ex_222', 'ex_223', 'ex_224', 'ex_225', 'ex_226', 'ex_227', 'ex_228', 'ex_229', 'ex_230', 'ex_231', 'ex_232',
    'ex_233', 'ex_234', 'ex_235', 'ex_236', 'ex_237', 'ex_238', 'ex_239', 'ex_240', 'ex_241', 'ex_242', 'ex_243',
    'ex_244', 'ex_245', 'ex_246', 'ex_247', 'ex_248', 'ex_249', 'ex_250', 'ex_251', 'ex_252', 'ex_253', 'ex_254',
    'ex_255', 'ex_256', 'ex_257', 'ex_258', 'ex_259', 'ex_260', 'ex_261', 'ex_262', 'ex_263', 'ex_264', 'ex_265',
    'ex_266', 'ex_267', 'ex_268', 'ex_269', 'ex_270', 'ex_271', 'ex_272', 'ex_273', 'ex_274', 'ex_275', 'ex_276',
    'ex_277', 'ex_278', 'ex_279', 'ex_280', 'ex_281', 'ex_282', 'ex_283', 'ex_284', 'ex_285', 'ex_286', 'ex_287',
    'ex_288', 'ex_289', 'ex_290', 'ex_291', 'ex_292', 'ex_293', 'ex_294', 'ex_295', 'ex_296', 'ex_297', 'ex_298',
    'ex_299'
  );
  IF n_total <> n_backfilled THEN
    RAISE EXCEPTION 'load_type: % exercícios no catálogo, % cobertos pelo backfill', n_total, n_backfilled;
  END IF;
END $$;

COMMIT;
